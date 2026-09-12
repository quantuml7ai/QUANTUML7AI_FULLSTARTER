import torch.nn.functional as F

def causal_lm_loss(logits, labels, ignore_index=-100):
    return F.cross_entropy(logits[:,:-1].contiguous().view(-1,logits.size(-1)),labels[:,1:].contiguous().view(-1),ignore_index=ignore_index)
