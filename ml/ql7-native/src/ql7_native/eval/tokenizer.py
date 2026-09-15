def fertility(token_counts,text_units):
    if len(token_counts)!=len(text_units): raise ValueError("length_mismatch")
    vals=[float(t)/max(1,float(u)) for t,u in zip(token_counts,text_units)]
    return {"count":len(vals),"meanFertility":sum(vals)/max(1,len(vals)),"maxFertility":max(vals) if vals else 0.0}
