import torch.nn.functional as F

def critic_loss(scores, labels): return F.binary_cross_entropy_with_logits(scores,labels.float())
