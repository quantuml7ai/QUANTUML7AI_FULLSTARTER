import math
def softmax(xs,t=1.0):z=[x/max(float(t),1e-6) for x in xs];m=max(z);e=[math.exp(x-m) for x in z];s=sum(e);return [x/s for x in e]
def brier(probs,target):return sum((p-(1 if i==target else 0))**2 for i,p in enumerate(probs))
def nll(rows,t):return -sum(math.log(max(1e-12,softmax(logits,t)[target])) for logits,target in rows)/max(1,len(rows))
def fit_temperature(rows,low=.25,high=5.0,steps=200):
    best=(1.0,float('inf'))
    for i in range(steps+1):
        t=low+(high-low)*i/steps;v=nll(rows,t)
        if v<best[1]:best=(t,v)
    return {'method':'temperature_scaling','temperature':best[0],'nll':best[1],'records':len(rows)}
