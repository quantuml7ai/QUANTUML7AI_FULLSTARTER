REQUIRED=("lineage","splitLeakage","tokenizer","semantic","calibration","ood","safety","retrieval","naturalness","composerParity","security","reads","presentation","delivery","noEgress")
def evaluate(receipts):
    missing=[x for x in REQUIRED if x not in receipts]
    failed=[x for x in REQUIRED if x in receipts and not bool(receipts[x].get("ok",False))]
    return {"ok":not missing and not failed,"missing":missing,"failed":failed,"required":REQUIRED}
