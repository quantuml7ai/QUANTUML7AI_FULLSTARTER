from __future__ import annotations

import contextlib
import hashlib
import json
import math
import os
import random
import time
import uuid
from pathlib import Path

import torch
from torch.utils.data import DataLoader, IterableDataset
from torch.utils.data.distributed import DistributedSampler


def _canonical_json(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)


def _sha_json(value):
    return hashlib.sha256(_canonical_json(value).encode("utf-8")).hexdigest()


def _atomic_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".ql7tmp")
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2, default=str), encoding="utf-8")
    os.replace(tmp, path)


def _atomic_torch_save(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".ql7tmp")
    torch.save(value, tmp)
    os.replace(tmp, path)


def _seed_all(seed):
    random.seed(int(seed))
    torch.manual_seed(int(seed))
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(int(seed))


def _capture_rng_state():
    return {
        "python": random.getstate(),
        "torch": torch.get_rng_state(),
        "cuda": torch.cuda.get_rng_state() if torch.cuda.is_available() else None,
    }


def _restore_rng_state(state):
    if not state:
        return
    if state.get("python") is not None:
        random.setstate(state["python"])
    if state.get("torch") is not None:
        torch.set_rng_state(state["torch"])
    if torch.cuda.is_available() and state.get("cuda") is not None:
        torch.cuda.set_rng_state(state["cuda"])


def _resolve_device(device=None, local_rank=0):
    if device:
        return torch.device(device)
    if torch.cuda.is_available():
        return torch.device("cuda", int(local_rank))
    return torch.device("cpu")


def _distributed_context(mode):
    mode = str(mode or "single").lower()
    if mode not in {"single", "fsdp"}:
        raise ValueError("distributed_mode_must_be_single_or_fsdp")
    if mode == "single":
        return {"mode": "single", "rank": 0, "world_size": 1, "local_rank": 0, "initialized_here": False}

    if not torch.distributed.is_available():
        raise RuntimeError("torch_distributed_unavailable")
    if not torch.cuda.is_available():
        raise RuntimeError("fsdp_accelerator_required")

    initialized_here = False
    if not torch.distributed.is_initialized():
        world_size = int(os.environ.get("WORLD_SIZE", "1"))
        rank = int(os.environ.get("RANK", "0"))
        local_rank = int(os.environ.get("LOCAL_RANK", str(rank)))
        backend = "nccl" if torch.cuda.is_available() and os.name != "nt" else "gloo"
        # env:// intentionally requires MASTER_ADDR/MASTER_PORT for multi-process jobs.
        torch.distributed.init_process_group(backend=backend, init_method="env://", rank=rank, world_size=world_size)
        initialized_here = True
    rank = torch.distributed.get_rank()
    world_size = torch.distributed.get_world_size()
    local_rank = int(os.environ.get("LOCAL_RANK", str(rank)))
    return {
        "mode": "fsdp",
        "rank": rank,
        "world_size": world_size,
        "local_rank": local_rank,
        "initialized_here": initialized_here,
    }


def _wrap_model(model, dist_ctx, device):
    if dist_ctx["mode"] == "single":
        return model.to(device)
    from torch.distributed.fsdp import FullyShardedDataParallel as FSDP

    model = model.to(device)
    kwargs = {"use_orig_params": True}
    if device.type == "cuda":
        kwargs["device_id"] = device
    return FSDP(model, **kwargs)


def _is_main(dist_ctx):
    return int(dist_ctx.get("rank", 0)) == 0


def _barrier(dist_ctx):
    if dist_ctx["mode"] == "fsdp" and torch.distributed.is_initialized():
        torch.distributed.barrier()


def _gather_rng_state(dist_ctx):
    local = _capture_rng_state()
    if dist_ctx["mode"] == "single" or dist_ctx["world_size"] == 1:
        return {str(dist_ctx["rank"]): local}
    gathered = [None for _ in range(dist_ctx["world_size"])]
    torch.distributed.all_gather_object(gathered, local)
    return {str(i): row for i, row in enumerate(gathered)}


def _model_optimizer_state(model, optimizer, dist_ctx):
    if dist_ctx["mode"] == "single":
        return model.state_dict(), optimizer.state_dict()

    from torch.distributed.fsdp import (
        FullyShardedDataParallel as FSDP,
        FullOptimStateDictConfig,
        FullStateDictConfig,
        StateDictType,
    )

    with FSDP.state_dict_type(
        model,
        StateDictType.FULL_STATE_DICT,
        FullStateDictConfig(offload_to_cpu=True, rank0_only=True),
        FullOptimStateDictConfig(offload_to_cpu=True, rank0_only=True),
    ):
        model_state = model.state_dict()
        optim_state = FSDP.optim_state_dict(model, optimizer)
    return model_state, optim_state


def _load_model_optimizer_state(model, optimizer, payload, dist_ctx):
    if dist_ctx["mode"] == "single":
        model.load_state_dict(payload["model_state_dict"], strict=True)
        optimizer.load_state_dict(payload["optimizer_state_dict"])
        return

    from torch.distributed.fsdp import (
        FullyShardedDataParallel as FSDP,
        FullOptimStateDictConfig,
        FullStateDictConfig,
        StateDictType,
    )

    with FSDP.state_dict_type(
        model,
        StateDictType.FULL_STATE_DICT,
        FullStateDictConfig(offload_to_cpu=True, rank0_only=False),
        FullOptimStateDictConfig(offload_to_cpu=True, rank0_only=False),
    ):
        model.load_state_dict(payload["model_state_dict"], strict=True)
    converted = FSDP.optim_state_dict_to_load(model, optimizer, payload["optimizer_state_dict"])
    optimizer.load_state_dict(converted)


def _optimizer_to_device(optimizer, device):
    for state in optimizer.state.values():
        for key, value in list(state.items()):
            if torch.is_tensor(value):
                state[key] = value.to(device)


def _estimate_optimizer_steps(dataset, epochs, batch_size, grad_accum_steps, max_steps):
    if max_steps is not None:
        return max(1, int(max_steps))
    try:
        rows = len(dataset)
    except Exception:
        return max(1, int(epochs) * 1000)
    micro = max(1, math.ceil(rows / max(1, int(batch_size))))
    return max(1, math.ceil(micro * int(epochs) / max(1, int(grad_accum_steps))))


def _scheduler(optimizer, total_steps, warmup_steps=0, kind="cosine", min_lr_ratio=0.1):
    kind = str(kind or "cosine").lower()
    warmup_steps = max(0, int(warmup_steps))
    total_steps = max(1, int(total_steps))
    min_lr_ratio = max(0.0, min(1.0, float(min_lr_ratio)))

    def factor(step):
        step = int(step)
        if warmup_steps and step < warmup_steps:
            return max(1e-8, float(step + 1) / warmup_steps)
        progress = (step - warmup_steps) / max(1, total_steps - warmup_steps)
        progress = max(0.0, min(1.0, progress))
        if kind == "constant":
            return 1.0
        if kind == "linear":
            return min_lr_ratio + (1.0 - min_lr_ratio) * (1.0 - progress)
        if kind != "cosine":
            raise ValueError("scheduler_must_be_cosine_linear_or_constant")
        cosine = 0.5 * (1.0 + math.cos(math.pi * progress))
        return min_lr_ratio + (1.0 - min_lr_ratio) * cosine

    return torch.optim.lr_scheduler.LambdaLR(optimizer, factor)


def _make_loader(dataset, batch_size, epoch, seed, dist_ctx, num_workers=0, pin_memory=None):
    if isinstance(dataset, DataLoader):
        return dataset
    if isinstance(dataset, IterableDataset):
        if hasattr(dataset, "set_epoch"):
            dataset.set_epoch(epoch)
        return DataLoader(
            dataset,
            batch_size=batch_size,
            num_workers=int(num_workers),
            pin_memory=torch.cuda.is_available() if pin_memory is None else bool(pin_memory),
        )

    sampler = None
    shuffle = True
    generator = torch.Generator()
    generator.manual_seed(int(seed) + int(epoch))
    if dist_ctx["mode"] == "fsdp":
        sampler = DistributedSampler(
            dataset,
            num_replicas=dist_ctx["world_size"],
            rank=dist_ctx["rank"],
            shuffle=True,
            seed=int(seed),
            drop_last=False,
        )
        sampler.set_epoch(int(epoch))
        shuffle = False
    return DataLoader(
        dataset,
        batch_size=int(batch_size),
        shuffle=shuffle,
        sampler=sampler,
        generator=None if sampler is not None else generator,
        num_workers=int(num_workers),
        pin_memory=torch.cuda.is_available() if pin_memory is None else bool(pin_memory),
    )


def _move_batch(batch, device):
    if isinstance(batch, dict):
        return {k: (v.to(device, non_blocking=True) if hasattr(v, "to") else v) for k, v in batch.items()}
    if isinstance(batch, (list, tuple)):
        cls = tuple if isinstance(batch, tuple) else list
        return cls(v.to(device, non_blocking=True) if hasattr(v, "to") else v for v in batch)
    return batch.to(device, non_blocking=True) if hasattr(batch, "to") else batch


def _checkpoint_payload(model, optimizer, scheduler, scaler, state, dist_ctx, run_manifest):
    model_state, optimizer_state = _model_optimizer_state(model, optimizer, dist_ctx)
    rng_by_rank = _gather_rng_state(dist_ctx)
    return {
        "schema": "ql7.native.training-checkpoint",
        "schemaVersion": 2,
        "createdAt": time.time(),
        "distributedMode": dist_ctx["mode"],
        "worldSize": dist_ctx["world_size"],
        "state": dict(state),
        "model_state_dict": model_state,
        "optimizer_state_dict": optimizer_state,
        "scheduler_state_dict": scheduler.state_dict() if scheduler is not None else None,
        "scaler_state_dict": scaler.state_dict() if scaler is not None and scaler.is_enabled() else None,
        "rng_by_rank": rng_by_rank,
        "runManifest": run_manifest,
        "runManifestHash": _sha_json(run_manifest),
    }


def save_training_checkpoint(path, model, optimizer, scheduler, scaler, state, dist_ctx, run_manifest):
    payload = _checkpoint_payload(model, optimizer, scheduler, scaler, state, dist_ctx, run_manifest)
    if _is_main(dist_ctx):
        _atomic_torch_save(path, payload)
    _barrier(dist_ctx)
    return str(Path(path))


def load_training_checkpoint(path, model, optimizer, scheduler, scaler, dist_ctx, device):
    path = Path(path)
    if not path.is_file():
        raise ValueError("resume_checkpoint_missing")
    payload = torch.load(path, map_location="cpu", weights_only=False)
    if payload.get("schema") != "ql7.native.training-checkpoint":
        raise ValueError("resume_checkpoint_schema")
    _load_model_optimizer_state(model, optimizer, payload, dist_ctx)
    _optimizer_to_device(optimizer, device)
    if scheduler is not None and payload.get("scheduler_state_dict") is not None:
        scheduler.load_state_dict(payload["scheduler_state_dict"])
    if scaler is not None and payload.get("scaler_state_dict") is not None:
        scaler.load_state_dict(payload["scaler_state_dict"])
    rank_state = (payload.get("rng_by_rank") or {}).get(str(dist_ctx["rank"]))
    if rank_state is None:
        rank_state = (payload.get("rng_by_rank") or {}).get("0")
    _restore_rng_state(rank_state)
    return payload


def _write_receipt(checkpoint_dir, receipt, dist_ctx):
    if not checkpoint_dir or not _is_main(dist_ctx):
        return None
    path = Path(checkpoint_dir) / "training-receipt.json"
    _atomic_json(path, receipt)
    return str(path)


def train_loop(
    model,
    dataset,
    loss_fn=None,
    epochs=1,
    batch_size=8,
    lr=3e-4,
    weight_decay=.1,
    grad_clip=1.0,
    device=None,
    *,
    distributed="single",
    gradient_accumulation_steps=1,
    max_steps=None,
    warmup_steps=0,
    scheduler="cosine",
    min_lr_ratio=0.1,
    checkpoint_dir=None,
    checkpoint_every_steps=0,
    resume_from=None,
    seed=777,
    num_workers=0,
    pin_memory=None,
    eval_fn=None,
    eval_every_steps=0,
    run_id=None,
    stage="training",
    checkpoint_on_exception=True,
):
    """Canonical QL7 training executor.

    Supports single-process CUDA/CPU and canonical PyTorch FSDP, deterministic
    map-style data sampling, gradient accumulation, warmup/scheduling, atomic
    checkpoint/resume (model/optimizer/scheduler/scaler/RNG/progress), optional
    evaluation hooks, and evidence receipts. FSDP is the only distributed owner;
    DeepSpeed/DDP parallel training owners are intentionally not introduced.
    """
    if model is None:
        raise ValueError("model_required")
    if dataset is None:
        raise ValueError("dataset_required")

    grad_accum = max(1, int(gradient_accumulation_steps))
    epochs = max(1, int(epochs))
    checkpoint_every_steps = max(0, int(checkpoint_every_steps))
    eval_every_steps = max(0, int(eval_every_steps))
    run_id = str(run_id or f"ql7-{stage}-{uuid.uuid4().hex[:12]}")

    dist_ctx = _distributed_context(distributed)
    resolved_device = _resolve_device(device, dist_ctx["local_rank"])
    if resolved_device.type == "cuda":
        torch.cuda.set_device(resolved_device)

    _seed_all(seed + dist_ctx["rank"])
    model = _wrap_model(model, dist_ctx, resolved_device)

    optimizer = torch.optim.AdamW(model.parameters(), lr=float(lr), weight_decay=float(weight_decay))
    total_steps = _estimate_optimizer_steps(dataset, epochs, batch_size, grad_accum, max_steps)
    lr_scheduler = _scheduler(optimizer, total_steps, warmup_steps, scheduler, min_lr_ratio)

    use_amp = resolved_device.type == "cuda"
    amp_dtype = torch.bfloat16 if use_amp and torch.cuda.is_bf16_supported() else torch.float16
    scaler_enabled = bool(use_amp and amp_dtype == torch.float16)
    try:
        scaler = torch.amp.GradScaler("cuda", enabled=scaler_enabled)
    except Exception:
        scaler = torch.cuda.amp.GradScaler(enabled=scaler_enabled)

    state = {
        "global_step": 0,
        "micro_step": 0,
        "epoch": 0,
        "batch_in_epoch": 0,
        "last_loss": None,
    }
    run_manifest = {
        "schema": "ql7.native.training-run",
        "schemaVersion": 2,
        "runId": run_id,
        "stage": str(stage),
        "seed": int(seed),
        "distributed": dist_ctx["mode"],
        "worldSize": dist_ctx["world_size"],
        "epochs": epochs,
        "batchSize": int(batch_size),
        "gradientAccumulationSteps": grad_accum,
        "maxSteps": None if max_steps is None else int(max_steps),
        "lr": float(lr),
        "weightDecay": float(weight_decay),
        "gradClip": float(grad_clip),
        "warmupSteps": int(warmup_steps),
        "scheduler": str(scheduler),
        "deviceType": resolved_device.type,
        "ampDtype": str(amp_dtype) if use_amp else "none",
        "parameterCount": sum(p.numel() for p in model.parameters()),
    }

    resumed = False
    if resume_from:
        payload = load_training_checkpoint(
            resume_from, model, optimizer, lr_scheduler, scaler, dist_ctx, resolved_device
        )
        state.update(payload.get("state") or {})
        resumed = True
        previous_manifest_hash = payload.get("runManifestHash")
        run_manifest["resumedFrom"] = str(resume_from)
        run_manifest["previousRunManifestHash"] = previous_manifest_hash

    checkpoint_dir_path = Path(checkpoint_dir) if checkpoint_dir else None
    if checkpoint_dir_path and _is_main(dist_ctx):
        checkpoint_dir_path.mkdir(parents=True, exist_ok=True)
        _atomic_json(checkpoint_dir_path / "run-manifest.json", run_manifest)
    _barrier(dist_ctx)

    losses = []
    eval_rows = []
    started = time.time()
    optimizer.zero_grad(set_to_none=True)
    pending_micro = 0

    def optimizer_step(loss_for_log):
        nonlocal pending_micro
        if scaler.is_enabled():
            scaler.unscale_(optimizer)
        torch.nn.utils.clip_grad_norm_(model.parameters(), float(grad_clip))
        if scaler.is_enabled():
            scaler.step(optimizer)
            scaler.update()
        else:
            optimizer.step()
        optimizer.zero_grad(set_to_none=True)
        lr_scheduler.step()
        pending_micro = 0
        state["global_step"] = int(state["global_step"]) + 1
        state["last_loss"] = float(loss_for_log)

    try:
        start_epoch = int(state.get("epoch", 0))
        stop_requested = False
        for epoch in range(start_epoch, epochs):
            state["epoch"] = epoch
            loader = _make_loader(dataset, batch_size, epoch, seed, dist_ctx, num_workers, pin_memory)
            resume_batch = int(state.get("batch_in_epoch", 0)) if epoch == start_epoch else 0

            for batch_index, batch in enumerate(loader):
                if batch_index < resume_batch:
                    continue
                batch = _move_batch(batch, resolved_device)
                state["micro_step"] = int(state.get("micro_step", 0)) + 1
                state["batch_in_epoch"] = batch_index + 1

                ctx = (
                    torch.autocast(device_type="cuda", dtype=amp_dtype)
                    if use_amp
                    else contextlib.nullcontext()
                )
                with ctx:
                    out = model(**batch) if isinstance(batch, dict) else model(batch)
                    loss = loss_fn(out, batch) if loss_fn else out.get("loss") if isinstance(out, dict) else None
                    if loss is None:
                        raise ValueError("loss_required")
                    if not torch.isfinite(loss):
                        raise RuntimeError("non_finite_loss")
                    backprop_loss = loss / grad_accum

                if scaler.is_enabled():
                    scaler.scale(backprop_loss).backward()
                else:
                    backprop_loss.backward()
                pending_micro += 1
                raw_loss = float(loss.detach().cpu())
                losses.append(raw_loss)

                if pending_micro >= grad_accum:
                    optimizer_step(raw_loss)

                    if eval_fn and eval_every_steps and state["global_step"] % eval_every_steps == 0:
                        model.eval()
                        eval_result = eval_fn(model, state["global_step"])
                        eval_rows.append({"step": state["global_step"], "result": eval_result})
                        model.train()

                    if checkpoint_dir_path and checkpoint_every_steps and state["global_step"] % checkpoint_every_steps == 0:
                        save_training_checkpoint(
                            checkpoint_dir_path / f"step-{state['global_step']:08d}.pt",
                            model,
                            optimizer,
                            lr_scheduler,
                            scaler,
                            state,
                            dist_ctx,
                            run_manifest,
                        )

                    if max_steps is not None and state["global_step"] >= int(max_steps):
                        stop_requested = True
                        break

            if pending_micro and not stop_requested:
                optimizer_step(losses[-1])
            if stop_requested:
                break
            state["epoch"] = epoch + 1
            state["batch_in_epoch"] = 0

        final_checkpoint = None
        if checkpoint_dir_path:
            final_checkpoint = checkpoint_dir_path / "latest.pt"
            save_training_checkpoint(
                final_checkpoint,
                model,
                optimizer,
                lr_scheduler,
                scaler,
                state,
                dist_ctx,
                run_manifest,
            )

        elapsed = time.time() - started
        receipt = {
            "schema": "ql7.native.training-receipt",
            "schemaVersion": 2,
            "status": "TRAINED_CANDIDATE",
            "runId": run_id,
            "stage": str(stage),
            "steps": int(state["global_step"]),
            "microSteps": int(state["micro_step"]),
            "meanLoss": sum(losses) / max(1, len(losses)),
            "lastLoss": state.get("last_loss"),
            "device": str(resolved_device),
            "distributed": dist_ctx["mode"],
            "worldSize": dist_ctx["world_size"],
            "resumed": resumed,
            "elapsedSeconds": elapsed,
            "finalCheckpoint": str(final_checkpoint) if final_checkpoint else None,
            "eval": eval_rows,
            "runManifestHash": _sha_json(run_manifest),
        }
        receipt["receiptHash"] = _sha_json(receipt)
        receipt_path = _write_receipt(checkpoint_dir_path, receipt, dist_ctx)
        if receipt_path:
            receipt["receiptPath"] = receipt_path
        return receipt

    except BaseException as exc:
        if checkpoint_dir_path and checkpoint_on_exception:
            try:
                save_training_checkpoint(
                    checkpoint_dir_path / "emergency.pt",
                    model,
                    optimizer,
                    lr_scheduler,
                    scaler,
                    state,
                    dist_ctx,
                    run_manifest,
                )
            except Exception:
                pass
        failure = {
            "schema": "ql7.native.training-failure-receipt",
            "schemaVersion": 1,
            "runId": run_id,
            "stage": str(stage),
            "errorType": type(exc).__name__,
            "error": str(exc),
            "state": state,
            "runManifestHash": _sha_json(run_manifest),
        }
        _write_receipt(checkpoint_dir_path, failure, dist_ctx)
        raise
    finally:
        _barrier(dist_ctx)


def train_from_config(model, dataset, config, loss_fn=None, *, stage="training"):
    """Stable wrapper used by all QL7 training stages."""
    config = dict(config or {})
    return train_loop(
        model,
        dataset,
        loss_fn=loss_fn,
        epochs=config.get("epochs", 1),
        batch_size=config.get("batch_size", 8),
        lr=config.get("lr", 3e-4),
        weight_decay=config.get("weight_decay", .1),
        grad_clip=config.get("grad_clip", 1.0),
        device=config.get("device"),
        distributed=config.get("distributed", "single"),
        gradient_accumulation_steps=config.get("gradient_accumulation_steps", 1),
        max_steps=config.get("max_steps"),
        warmup_steps=config.get("warmup_steps", 0),
        scheduler=config.get("scheduler", "cosine"),
        min_lr_ratio=config.get("min_lr_ratio", .1),
        checkpoint_dir=config.get("checkpoint_dir"),
        checkpoint_every_steps=config.get("checkpoint_every_steps", 0),
        resume_from=config.get("resume_from"),
        seed=config.get("seed", 777),
        num_workers=config.get("num_workers", 0),
        pin_memory=config.get("pin_memory"),
        eval_fn=config.get("eval_fn"),
        eval_every_steps=config.get("eval_every_steps", 0),
        run_id=config.get("run_id"),
        stage=stage,
        checkpoint_on_exception=config.get("checkpoint_on_exception", True),
    )
