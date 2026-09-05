from __future__ import annotations

from hashlib import sha256
from pathlib import Path
import json

from .architecture import expected_parameter_inventory, sha_json, validate_architecture_config


def _artifact_rows(artifacts):
    rows={}
    for role,value in artifacts.items():
        path=Path(value)
        if not path.is_file(): raise ValueError(f"release_artifact_missing:{role}")
        rows[role]={"artifact":str(value),"sha256":sha256(path.read_bytes()).hexdigest(),"bytes":path.stat().st_size}
    return rows


def build(release_id,artifacts,promotion_status='BOOTSTRAP_STRUCTURAL',architecture_config=None,parameter_inventory=None,training_lineage_hash=None,calibration_artifact_hash=None):
    if not release_id: raise ValueError("release_id_required")
    rows=_artifact_rows(artifacts)
    manifest={
        'schema':'ql7.native-model-release',
        'schemaVersion':2,
        'releaseId':str(release_id),
        'active':True,
        'promotionStatus':str(promotion_status),
        **rows,
    }
    if architecture_config is not None:
        validate_architecture_config(architecture_config)
        expected=expected_parameter_inventory(architecture_config)
        inventory=parameter_inventory or expected
        manifest['architectureConfig']=architecture_config
        manifest['architectureConfigHash']=sha_json(architecture_config)
        manifest['parameterInventory']=inventory
        manifest['expectedParameterInventory']=expected
        manifest['parameterInventoryHash']=sha_json(inventory)
    if training_lineage_hash is not None: manifest['trainingLineageHash']=str(training_lineage_hash)
    if calibration_artifact_hash is not None: manifest['calibrationArtifactHash']=str(calibration_artifact_hash)

    if manifest['promotionStatus']=='PRODUCTION_PROMOTED':
        if architecture_config is None: raise ValueError('production_architecture_config_required')
        if parameter_inventory is None: raise ValueError('production_parameter_inventory_required')
        expected=manifest['expectedParameterInventory']['roles']
        actual=(parameter_inventory or {}).get('roles') or {}
        mismatches=[role for role,count in expected.items() if int(actual.get(role,-1))!=int(count)]
        if mismatches: raise ValueError('production_parameter_inventory_mismatch:'+','.join(mismatches))
        if not manifest.get('trainingLineageHash'): raise ValueError('production_training_lineage_required')
        if not manifest.get('calibrationArtifactHash'): raise ValueError('production_calibration_required')
    return manifest
