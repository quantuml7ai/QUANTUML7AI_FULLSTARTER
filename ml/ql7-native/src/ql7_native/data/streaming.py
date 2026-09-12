from __future__ import annotations

import hashlib
import json
from pathlib import Path

import torch
from torch.utils.data import IterableDataset, get_worker_info


class JsonlShardDataset(IterableDataset):
    """Deterministic streaming JSONL dataset backed by a signed shard manifest.

    Files are hash-verified before iteration when ``verify_hashes`` is enabled.
    Rows are partitioned by distributed rank and DataLoader worker using a stable
    global row index. ``set_resume_offset`` allows exact logical row skipping for
    checkpoint continuation when shard contents and world geometry are unchanged.
    """

    def __init__(self, manifest, root=".", transform=None, verify_hashes=True, rank=0, world_size=1):
        super().__init__()
        self.manifest = manifest if isinstance(manifest, dict) else json.loads(Path(manifest).read_text(encoding="utf-8"))
        if self.manifest.get("schema") != "ql7.native.training-shards":
            raise ValueError("training_shard_manifest_schema")
        self.root = Path(root)
        self.transform = transform
        self.verify_hashes = bool(verify_hashes)
        self.rank = int(rank)
        self.world_size = max(1, int(world_size))
        self.resume_offset = 0
        self.epoch = 0
        if not (0 <= self.rank < self.world_size):
            raise ValueError("invalid_rank_world_size")

    def set_resume_offset(self, offset):
        self.resume_offset = max(0, int(offset))

    def set_epoch(self, epoch):
        self.epoch = max(0, int(epoch))

    def _path(self, row):
        raw = Path(str(row.get("path", "")))
        return raw if raw.is_absolute() else self.root / raw

    def _verify(self, row, path):
        if not path.is_file():
            raise FileNotFoundError(f"training_shard_missing:{path}")
        if not self.verify_hashes:
            return
        expected = str(row.get("sha256") or "").lower()
        if not expected:
            raise ValueError(f"training_shard_hash_missing:{path}")
        actual = hashlib.sha256(path.read_bytes()).hexdigest()
        if actual != expected:
            raise ValueError(f"training_shard_hash_mismatch:{path}")

    def __iter__(self):
        worker = get_worker_info()
        worker_id = worker.id if worker else 0
        worker_count = worker.num_workers if worker else 1
        partition_count = self.world_size * worker_count
        partition_id = self.rank * worker_count + worker_id

        global_index = 0
        emitted_for_partition = 0
        for shard in self.manifest.get("files", []):
            path = self._path(shard)
            self._verify(shard, path)
            with path.open("r", encoding="utf-8") as handle:
                for line_number, line in enumerate(handle, 1):
                    line = line.strip()
                    if not line:
                        continue
                    assigned = (global_index % partition_count) == partition_id
                    global_index += 1
                    if not assigned:
                        continue
                    if emitted_for_partition < self.resume_offset:
                        emitted_for_partition += 1
                        continue
                    try:
                        row = json.loads(line)
                    except json.JSONDecodeError as exc:
                        raise ValueError(f"training_shard_json:{path}:{line_number}") from exc
                    emitted_for_partition += 1
                    yield self.transform(row) if self.transform else row
