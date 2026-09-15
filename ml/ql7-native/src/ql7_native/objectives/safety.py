import torch.nn.functional as F

def safety_multitask_loss(head_logits, targets, weights=None):
    weights=weights or {}; losses={}
    for name,logits in head_logits.items(): losses[name]=F.cross_entropy(logits,targets[name])*float(weights.get(name,1.0))
    return sum(losses.values()),losses
