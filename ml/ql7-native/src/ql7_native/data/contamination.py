from collections import defaultdict

def assert_split_isolation(records):
    by_key=defaultdict(set)
    for row in records:
        split=getattr(row,"split",row.get("split")); keys=[getattr(row,"normalized_hash",None) if not isinstance(row,dict) else row.get("normalized_hash"), getattr(row,"near_duplicate_cluster",None) if not isinstance(row,dict) else row.get("near_duplicate_cluster")]
        for key in filter(None,keys): by_key[str(key)].add(str(split))
    leaks={k:sorted(v) for k,v in by_key.items() if len(v)>1 and ("train" in v) and ({"acceptance","holdout","human_review"}&v)}
    return {"ok":not leaks,"leakCount":len(leaks),"leaks":leaks}
