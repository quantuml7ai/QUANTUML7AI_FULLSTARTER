from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path

STAGES=("tokenizer","understanding_pretrain","generator_pretrain","domain_pretrain","multitask","sft","preference","safety","critic","calibration","quantization")


def validate_stage_plan(plan):
    rows=tuple(plan)
    missing=[x for x in STAGES if x not in rows]
    order_ok=[x for x in rows if x in STAGES]==[x for x in STAGES if x in rows]
    unknown=[x for x in rows if x not in STAGES]
    return {"ok":not missing and order_ok and not unknown,"required":STAGES,"missing":missing,"unknown":unknown,"orderOk":order_ok}


def _canonical(value):
    return json.dumps(value,sort_keys=True,separators=(",",":"),ensure_ascii=False,default=str)


def _hash(value):
    return hashlib.sha256(_canonical(value).encode("utf-8")).hexdigest()


def _atomic_json(path,value):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True);tmp=path.with_name(path.name+".ql7tmp")
    tmp.write_text(json.dumps(value,ensure_ascii=False,indent=2,default=str),encoding="utf-8");os.replace(tmp,path)


def execute_stage_plan(plan,runners,context=None,receipt_dir=None,resume=True):
    """Execute the canonical training DAG with chained stage receipts.

    ``runners`` maps each stage name to a callable ``runner(context)``. A stage
    may return any JSON-serializable result. Receipts are chained by the previous
    receipt hash, making skipped/resumed execution auditable without introducing
    a second orchestration owner.
    """
    validation=validate_stage_plan(plan)
    if not validation["ok"]: raise ValueError("invalid_training_stage_plan:"+_canonical(validation))
    context=dict(context or {})
    receipt_root=Path(receipt_dir) if receipt_dir else None
    if receipt_root: receipt_root.mkdir(parents=True,exist_ok=True)
    previous_hash="GENESIS"
    receipts=[]
    for index,stage in enumerate(plan):
        if stage not in runners or not callable(runners[stage]): raise ValueError(f"training_stage_runner_missing:{stage}")
        receipt_path=receipt_root/f"{index:02d}-{stage}.json" if receipt_root else None
        if resume and receipt_path and receipt_path.is_file():
            prior=json.loads(receipt_path.read_text(encoding="utf-8"))
            if prior.get("stage")==stage and prior.get("previousReceiptHash")==previous_hash and prior.get("status")=="PASS":
                previous_hash=prior.get("receiptHash") or ""
                receipts.append(prior)
                context["previousStageReceipt"]=prior
                continue
        result=runners[stage](context)
        receipt={
            "schema":"ql7.native.training-stage-receipt",
            "schemaVersion":2,
            "stage":stage,
            "index":index,
            "status":"PASS",
            "previousReceiptHash":previous_hash,
            "result":result,
            "resultHash":_hash(result),
        }
        receipt["receiptHash"]=_hash(receipt)
        if receipt_path: _atomic_json(receipt_path,receipt)
        receipts.append(receipt)
        previous_hash=receipt["receiptHash"]
        context["previousStageReceipt"]=receipt
    summary={
        "schema":"ql7.native.training-dag-receipt",
        "schemaVersion":2,
        "status":"PASS",
        "stages":len(receipts),
        "finalReceiptHash":previous_hash,
        "receipts":[{"stage":r["stage"],"receiptHash":r["receiptHash"]} for r in receipts],
    }
    summary["dagReceiptHash"]=_hash(summary)
    if receipt_root: _atomic_json(receipt_root/"dag-receipt.json",summary)
    return summary
