from __future__ import annotations
from dataclasses import dataclass, asdict
from hashlib import sha256
import json

ALLOWED_SPLITS={"train","calibration","acceptance","holdout","human_review"}
RESTRICTED_LICENSES={"unknown","unverified","forbidden"}

@dataclass(frozen=True)
class DatasetRecord:
    record_id:str; source_family:str; source_ref:str; license_class:str; locale:str; domain:str
    pii_class:str="none"; consent_class:str="public_or_licensed"; normalized_hash:str=""; near_duplicate_cluster:str=""
    quality_score:float=1.0; split:str="train"; reviewer_class:str="machine_checked"; provenance_hash:str=""
    def canonical(self): return json.dumps(asdict(self),sort_keys=True,separators=(",",":"),ensure_ascii=False)
    def receipt_hash(self): return sha256(self.canonical().encode("utf-8")).hexdigest()

def validate_record(row:DatasetRecord):
    failures=[]
    if not row.record_id: failures.append("record_id_missing")
    if not row.source_family or not row.source_ref: failures.append("source_provenance_missing")
    if row.license_class.lower() in RESTRICTED_LICENSES: failures.append("license_not_approved")
    if row.split not in ALLOWED_SPLITS: failures.append("split_invalid")
    if not (0.0 <= float(row.quality_score) <= 1.0): failures.append("quality_out_of_range")
    if row.pii_class not in {"none","redacted","public"}: failures.append("pii_not_redacted")
    if row.consent_class in {"private_unconsented","unknown"}: failures.append("consent_not_proven")
    return {"ok":not failures,"failures":failures,"receiptHash":row.receipt_hash()}

def lineage_manifest(records):
    rows=list(records); validations=[validate_record(r) for r in rows]
    payload="\n".join(sorted(r.receipt_hash() for r in rows))
    return {"schema":"ql7.native.dataset-lineage","schemaVersion":1,"records":len(rows),"ok":all(v["ok"] for v in validations),"failures":[f for v in validations for f in v["failures"]],"lineageHash":sha256(payload.encode()).hexdigest()}
