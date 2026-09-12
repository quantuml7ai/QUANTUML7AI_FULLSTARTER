from hashlib import sha256
from pathlib import Path
import json

def build_shard_manifest(paths, metadata=None):
    rows=[]
    for p in map(Path,paths):
        b=p.read_bytes(); rows.append({"path":str(p),"bytes":len(b),"sha256":sha256(b).hexdigest()})
    body={"schema":"ql7.native.training-shards","schemaVersion":1,"files":rows,"metadata":metadata or {}}
    body["manifestHash"]=sha256(json.dumps(body,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()).hexdigest()
    return body
