from hashlib import sha256
from pathlib import Path
import json

def build_quantization_receipt(input_artifact, output_artifact, method, acceptance_hash, severe_regressions=0):
    if int(severe_regressions)!=0: raise ValueError("severe_regression_blocks_quantization")
    src=Path(input_artifact); dst=Path(output_artifact)
    if not src.is_file() or not dst.is_file(): raise ValueError("quantization_artifact_missing")
    return {"schema":"ql7.native.quantization-receipt","schemaVersion":1,"method":str(method),"inputSha256":sha256(src.read_bytes()).hexdigest(),"outputSha256":sha256(dst.read_bytes()).hexdigest(),"acceptanceHash":str(acceptance_hash),"severeRegressions":0}
