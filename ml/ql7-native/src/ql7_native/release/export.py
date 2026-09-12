from pathlib import Path
from hashlib import sha256
import os, shutil

def atomic_export(source, destination):
    src=Path(source); dst=Path(destination)
    if not src.is_file(): raise ValueError("source_artifact_missing")
    dst.parent.mkdir(parents=True,exist_ok=True); tmp=dst.with_name(dst.name+".ql7tmp")
    shutil.copyfile(src,tmp); os.replace(tmp,dst)
    b=dst.read_bytes(); return {"path":str(dst),"bytes":len(b),"sha256":sha256(b).hexdigest()}
