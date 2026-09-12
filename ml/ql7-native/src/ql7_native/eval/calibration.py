import math

def expected_calibration_error(confidences,correct,bins=15):
    n=max(1,len(confidences)); total=0.0
    for i in range(bins):
        lo=i/bins; hi=(i+1)/bins; idx=[j for j,c in enumerate(confidences) if lo<=float(c)<hi or (i==bins-1 and float(c)==1.0)]
        if not idx: continue
        acc=sum(bool(correct[j]) for j in idx)/len(idx); conf=sum(float(confidences[j]) for j in idx)/len(idx); total+=len(idx)/n*abs(acc-conf)
    return total

def brier_binary(probs,labels): return sum((float(p)-float(y))**2 for p,y in zip(probs,labels))/max(1,len(probs))
def nll_binary(probs,labels): return -sum(float(y)*math.log(max(1e-12,float(p)))+(1-float(y))*math.log(max(1e-12,1-float(p))) for p,y in zip(probs,labels))/max(1,len(probs))
