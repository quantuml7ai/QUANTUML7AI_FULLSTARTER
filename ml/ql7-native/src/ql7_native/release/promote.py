import copy

from .architecture import sha_json
from .sign import verify_manifest


def promote(candidate,evidence,signature,verification_key=None):
    required=("lineage","calibration","acceptance","noEgress","rollback")
    missing=[x for x in required if not evidence.get(x,{}).get("ok",False)]
    if missing: raise ValueError("promotion_evidence_missing:"+",".join(missing))
    if not signature: raise ValueError("promotion_signature_required")
    if verification_key is None: raise ValueError("promotion_verification_key_required")
    if not verify_manifest(candidate,verification_key,signature): raise ValueError("promotion_signature_invalid")
    if not candidate.get("architectureConfig") or not candidate.get("parameterInventory"):
        raise ValueError("promotion_architecture_inventory_required")
    if not candidate.get("trainingLineageHash"): raise ValueError("promotion_training_lineage_required")
    if not candidate.get("calibrationArtifactHash"): raise ValueError("promotion_calibration_required")
    out=copy.deepcopy(candidate)
    signed_status=candidate.get("promotionStatus")
    out["promotionStatus"]="PRODUCTION_PROMOTED"
    out["promotionReceipt"]={
        "signature":signature,
        "evidenceKeys":list(required),
        "verified":True,
        "signedCandidatePromotionStatus":signed_status,
        "signedCandidateHash":sha_json(candidate),
    }
    return out
