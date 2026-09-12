import json,hashlib
from pathlib import Path
def load(root):
 p=Path(root)/'models/ql7-native/active-manifest.json';m=json.loads(p.read_text(encoding='utf-8'));m['_hash']=hashlib.sha256(p.read_bytes()).hexdigest();return m
