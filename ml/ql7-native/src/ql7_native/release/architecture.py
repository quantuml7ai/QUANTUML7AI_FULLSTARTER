from __future__ import annotations

import hashlib
import json
from pathlib import Path


def canonical_json(value):
    return json.dumps(value,sort_keys=True,separators=(",",":"),ensure_ascii=False,default=str)


def sha_json(value):
    return hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()


def load_architecture_config(path):
    payload=json.loads(Path(path).read_text(encoding="utf-8"))
    if payload.get("schema")!="ql7.native.architecture-config":
        raise ValueError("architecture_config_schema")
    validate_architecture_config(payload)
    return payload


def _transformer_backbone_params(cfg):
    v=int(cfg["vocab_size"]);h=int(cfg["hidden_size"]);layers=int(cfg["layers"]);heads=int(cfg["heads"]);kv=int(cfg["kv_heads"]);inter=int(cfg["intermediate_size"])
    if h%heads or heads%kv: raise ValueError("architecture_head_geometry")
    attn=(2*h*h)+(2*h*h*kv//heads)
    ff=3*h*inter
    norms=2*h
    return v*h+layers*(attn+ff+norms)+h


def expected_parameter_inventory(config):
    validate_architecture_config(config)
    gen=_transformer_backbone_params(config["generator"])
    uc=config["understanding"];uh=config.get("understandingHeads") or {}
    u=_transformer_backbone_params(uc)
    h=int(uc["hidden_size"])
    emb=int(uh.get("embedding_dim",h));u+=h*emb
    for key,default in [("intents",256),("topics",2048),("entity_labels",96),("discourse",32),("emotions",24),("safety",48),("locale_labels",32)]:
        n=int(uh.get(key,default));u+=h*n+n
    for n in (2,2,1): u+=h*n+n
    u+=2*h*h
    cc=config["critic"];c=_transformer_backbone_params(cc);ch=int(cc["hidden_size"]);c+=ch*8+8
    nc=config.get("normalizer") or {};nv=int(nc.get("vocab_size",384));nh=int(nc.get("hidden",256))
    n=nv*nh + (12*nh*nh+12*nh) + (2*nh*4+4) + (2*nh*nv+nv)
    roles={"normalizer":n,"understanding":u,"generator":gen,"critic":c}
    return {"schema":"ql7.native.parameter-inventory","schemaVersion":1,"roles":roles,"total":sum(roles.values())}


def validate_architecture_config(config):
    required=("normalizer","understanding","generator","critic")
    missing=[x for x in required if x not in config]
    if missing: raise ValueError("architecture_roles_missing:"+",".join(missing))
    for role in ("understanding","generator","critic"):
        row=config[role]
        for key in ("vocab_size","hidden_size","layers","heads","kv_heads","intermediate_size","max_seq_len"):
            if int(row.get(key,0))<=0: raise ValueError(f"architecture_invalid:{role}:{key}")
        if int(row["hidden_size"])%int(row["heads"]): raise ValueError(f"architecture_hidden_heads:{role}")
        if int(row["heads"])%int(row["kv_heads"]): raise ValueError(f"architecture_heads_kv:{role}")
    if int(config["normalizer"].get("vocab_size",0))<=0 or int(config["normalizer"].get("hidden",0))<=0:
        raise ValueError("architecture_invalid:normalizer")
    return True


def inventory_from_models(models):
    roles={}
    tensor_rows={}
    for role,model in models.items():
        if model is None: continue
        state=model.state_dict();roles[role]=sum(int(v.numel()) for v in model.parameters())
        tensor_rows[role]=[{"name":k,"shape":list(v.shape),"dtype":str(v.dtype),"numel":int(v.numel())} for k,v in state.items()]
    body={"schema":"ql7.native.parameter-inventory","schemaVersion":1,"roles":roles,"total":sum(roles.values()),"tensors":tensor_rows}
    body["tensorInventoryHash"]=sha_json(tensor_rows)
    return body
