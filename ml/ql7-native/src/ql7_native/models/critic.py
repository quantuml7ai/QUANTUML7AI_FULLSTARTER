import torch
from torch import nn
from .common import TransformerConfig,TransformerBackbone,masked_mean
class QL7Critic(nn.Module):
    DIMENSIONS=('factuality','plan_entailment','helpfulness','naturalness','language_quality','privacy_safety','allowed_action','redundancy')
    def __init__(self,config:TransformerConfig|None=None): super().__init__();self.config=config or TransformerConfig(hidden_size=512,layers=8,heads=8,kv_heads=4,intermediate_size=1408);self.backbone=TransformerBackbone(self.config,causal=False);self.head=nn.Linear(self.config.hidden_size,len(self.DIMENSIONS))
    def forward(self,input_ids,attention_mask=None):return {'dimension_logits':self.head(masked_mean(self.backbone(input_ids,attention_mask),attention_mask))}
    @torch.inference_mode()
    def score(self,input_ids,attention_mask=None):
        logits=self(input_ids,attention_mask)['dimension_logits'];p=torch.sigmoid(logits);return {k:p[:,i] for i,k in enumerate(self.DIMENSIONS)}
