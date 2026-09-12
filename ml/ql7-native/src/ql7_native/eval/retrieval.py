def retrieval_metrics(rankings,relevant_at_k=10):
    rr=[]; hit=[]
    for row in rankings:
        ranks=[i+1 for i,x in enumerate(row[:relevant_at_k]) if bool(x)]
        hit.append(bool(ranks)); rr.append(1/min(ranks) if ranks else 0.0)
    return {"count":len(rankings),"recallAtK":sum(hit)/max(1,len(hit)),"mrr":sum(rr)/max(1,len(rr))}
