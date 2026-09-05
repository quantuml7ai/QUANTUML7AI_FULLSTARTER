from __future__ import annotations

from pathlib import Path
from hashlib import sha256

from .architecture import expected_parameter_inventory, sha_json, validate_architecture_config

REQUIRED_ROLES=("tokenizer","normalizer","understanding","generator","critic")


def validate_manifest(manifest,root="."):
    failures=[]
    if manifest.get("schema")!="ql7.native-model-release": failures.append("schema")
    for role in REQUIRED_ROLES:
        row=manifest.get(role) or {}; rel=row.get("artifact")
        if not rel: failures.append(f"{role}:artifact_missing"); continue
        p=Path(root)/rel
        if not p.is_file(): failures.append(f"{role}:file_missing"); continue
        actual=sha256(p.read_bytes()).hexdigest(); expected=row.get("sha256") or row.get("weightsHash")
        if expected and actual!=expected: failures.append(f"{role}:hash_mismatch")
        if row.get("bytes") is not None and int(row["bytes"])!=p.stat().st_size: failures.append(f"{role}:bytes_mismatch")

    promoted=manifest.get("promotionStatus")=="PRODUCTION_PROMOTED"
    architecture=manifest.get("architectureConfig")
    inventory=manifest.get("parameterInventory")
    if promoted and not architecture: failures.append("architectureConfig:required_for_production")
    if promoted and not inventory: failures.append("parameterInventory:required_for_production")
    if architecture:
        try:
            validate_architecture_config(architecture)
            if manifest.get("architectureConfigHash") and manifest["architectureConfigHash"]!=sha_json(architecture):
                failures.append("architectureConfig:hash_mismatch")
            expected=expected_parameter_inventory(architecture)
            declared_expected=manifest.get("expectedParameterInventory")
            if declared_expected and declared_expected.get("roles")!=expected.get("roles"):
                failures.append("expectedParameterInventory:mismatch")
            if inventory:
                if manifest.get("parameterInventoryHash") and manifest["parameterInventoryHash"]!=sha_json(inventory):
                    failures.append("parameterInventory:hash_mismatch")
                if promoted:
                    roles=inventory.get("roles") or {}
                    for role,count in expected["roles"].items():
                        if int(roles.get(role,-1))!=int(count): failures.append(f"parameterInventory:{role}:count_mismatch")
        except Exception as exc:
            failures.append("architectureConfig:"+str(exc))
    if promoted:
        if not manifest.get("trainingLineageHash"): failures.append("trainingLineageHash:required_for_production")
        if not manifest.get("calibrationArtifactHash"): failures.append("calibrationArtifactHash:required_for_production")
    return {"ok":not failures,"failures":failures}
