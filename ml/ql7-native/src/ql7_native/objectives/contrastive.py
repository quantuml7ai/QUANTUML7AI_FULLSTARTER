import torch
import torch.nn.functional as F

def info_nce(anchor, positive, negatives, temperature=0.07):
    a=F.normalize(anchor,dim=-1); p=F.normalize(positive,dim=-1); n=F.normalize(negatives,dim=-1)
    pos=(a*p).sum(-1,keepdim=True); neg=torch.einsum("bd,bkd->bk",a,n)
    logits=torch.cat([pos,neg],dim=-1)/max(float(temperature),1e-6)
    return F.cross_entropy(logits,torch.zeros(logits.shape[0],dtype=torch.long,device=logits.device))
