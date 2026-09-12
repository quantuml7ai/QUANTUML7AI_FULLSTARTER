from dataclasses import dataclass
import torch
from torch import nn
from .common import TransformerConfig,TransformerBackbone,masked_mean

@dataclass(frozen=True)
class UnderstandingHeadConfig:
    intents:int=256; topics:int=2048; entity_labels:int=96; discourse:int=32; emotions:int=24; safety:int=48; locale_labels:int=32; embedding_dim:int=768

class QL7UnderstandingCore(nn.Module):
    """Single multilingual encoder backbone with typed shared heads; weights are promoted only by signed release."""
    def __init__(self,config:TransformerConfig|None=None,heads:UnderstandingHeadConfig|None=None):
        super().__init__();self.config=config or TransformerConfig();self.heads=heads or UnderstandingHeadConfig(embedding_dim=self.config.hidden_size);self.backbone=TransformerBackbone(self.config,causal=False);d=self.config.hidden_size
        self.embedding=nn.Linear(d,self.heads.embedding_dim,bias=False);self.intent=nn.Linear(d,self.heads.intents);self.topic=nn.Linear(d,self.heads.topics);self.entity=nn.Linear(d,self.heads.entity_labels);self.negation=nn.Linear(d,2);self.quotation=nn.Linear(d,2);self.discourse=nn.Linear(d,self.heads.discourse);self.emotion=nn.Linear(d,self.heads.emotions);self.safety=nn.Linear(d,self.heads.safety);self.ood=nn.Linear(d,1);self.locale=nn.Linear(d,self.heads.locale_labels);self.coref_query=nn.Linear(d,d,bias=False);self.coref_key=nn.Linear(d,d,bias=False)
    def forward(self,input_ids,attention_mask=None):
        hidden=self.backbone(input_ids,attention_mask);pooled=masked_mean(hidden,attention_mask);q=self.coref_query(hidden);k=self.coref_key(hidden);coref=torch.matmul(q,k.transpose(-2,-1))/(hidden.shape[-1]**.5)
        return {'hidden':hidden,'embedding':torch.nn.functional.normalize(self.embedding(pooled),dim=-1),'intent_logits':self.intent(pooled),'topic_logits':self.topic(pooled),'entity_logits':self.entity(hidden),'negation_logits':self.negation(hidden),'quotation_logits':self.quotation(hidden),'discourse_logits':self.discourse(pooled),'emotion_logits':self.emotion(pooled),'safety_logits':self.safety(pooled),'ood_logit':self.ood(pooled).squeeze(-1),'locale_logits':self.locale(pooled),'coreference_logits':coref}
    @torch.inference_mode()
    def infer_tensors(self,input_ids,attention_mask=None):
        self.eval();return self(input_ids,attention_mask)
