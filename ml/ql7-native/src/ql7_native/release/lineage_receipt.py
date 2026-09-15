from hashlib import sha256
import json

def build(training_manifest,dataset_lineage,calibration,acceptance):
    body={"schema":"ql7.native.training-lineage-receipt","schemaVersion":1,"training":training_manifest,"dataset":dataset_lineage,"calibration":calibration,"acceptance":acceptance}
    body["receiptHash"]=sha256(json.dumps(body,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()).hexdigest(); return body
