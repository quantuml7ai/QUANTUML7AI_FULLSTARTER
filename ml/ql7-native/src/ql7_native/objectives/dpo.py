import torch
import torch.nn.functional as F

def dpo_loss(chosen_logp,rejected_logp,ref_chosen_logp,ref_rejected_logp,beta=0.1):
    margin=(chosen_logp-rejected_logp)-(ref_chosen_logp-ref_rejected_logp)
    return -F.logsigmoid(float(beta)*margin).mean()
