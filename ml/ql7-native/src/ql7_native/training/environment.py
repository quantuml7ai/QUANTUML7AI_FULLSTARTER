from __future__ import annotations

import json
import platform
import sys
from pathlib import Path


def _base_version(value):
    return str(value).split('+',1)[0]


def preflight(manifest_path, require_cuda=False, strict_reference=False):
    manifest=json.loads(Path(manifest_path).read_text(encoding="utf-8"))
    failures=[];facts={"python":platform.python_version(),"platform":platform.platform()}
    if manifest.get("schema")!="ql7.native.training-environment": failures.append("environment_manifest_schema")
    if not ((3,11)<=sys.version_info[:2]<(3,14)): failures.append("python_version_unsupported")
    try:
        import torch
        facts["torch"]=torch.__version__;facts["cudaAvailable"]=bool(torch.cuda.is_available());facts["torchCuda"]=torch.version.cuda
        if strict_reference and _base_version(torch.__version__)!=str(manifest.get("reference",{}).get("torch")): failures.append("torch_reference_mismatch")
        if require_cuda and not torch.cuda.is_available(): failures.append("cuda_required")
    except Exception as exc:
        failures.append("torch_unavailable:"+str(exc))
    try:
        import numpy
        facts["numpy"]=numpy.__version__
        if strict_reference and str(numpy.__version__)!=str(manifest.get("reference",{}).get("numpy")): failures.append("numpy_reference_mismatch")
    except Exception as exc:
        facts["numpy"]=None
        if strict_reference: failures.append("numpy_unavailable:"+str(exc))
    return {"schema":"ql7.native.training-environment-preflight","schemaVersion":1,"ok":not failures,"failures":failures,"facts":facts,"strictReference":bool(strict_reference),"requireCuda":bool(require_cuda)}
