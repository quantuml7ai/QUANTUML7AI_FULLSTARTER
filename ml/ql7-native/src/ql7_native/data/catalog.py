from dataclasses import dataclass,asdict
from hashlib import sha256
import json
@dataclass(frozen=True)
class DatasetRecord:
    record_id:str; source_family:str; source_id:str; license_class:str; locale:str; domain:str; pii_class:str='none'; consent_class:str='not_applicable'; split:str='train'; reviewer_class:str='unreviewed'
    def hash(self): return sha256(json.dumps(asdict(self),sort_keys=True,ensure_ascii=False).encode()).hexdigest()
