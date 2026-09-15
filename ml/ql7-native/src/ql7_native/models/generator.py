import torch
from torch import nn
from .common import TransformerConfig,TransformerBackbone
class QL7Generator(nn.Module):
    """Decoder-only multilingual generator. Sealed semantic plan/evidence serialization happens outside this model."""
    def __init__(self,config:TransformerConfig|None=None): super().__init__();self.config=config or TransformerConfig(hidden_size=1024,layers=16,heads=16,kv_heads=4,intermediate_size=2816);self.backbone=TransformerBackbone(self.config,causal=True);self.lm_head=nn.Linear(self.config.hidden_size,self.config.vocab_size,bias=False);self.lm_head.weight=self.backbone.emb.weight
    def forward(self,input_ids,attention_mask=None,labels=None):
        logits=self.lm_head(self.backbone(input_ids,attention_mask));loss=None
        if labels is not None: loss=nn.functional.cross_entropy(logits[:,:-1].contiguous().view(-1,logits.size(-1)),labels[:,1:].contiguous().view(-1),ignore_index=-100)
        return {'logits':logits,'loss':loss}
    @torch.inference_mode()
    def generate_ids(self,input_ids,max_new_tokens=128,temperature=.7,top_p=.9,eos_id=None):
        self.eval();ids=input_ids
        for _ in range(max_new_tokens):
            logits=self(ids)['logits'][:,-1]/max(.05,float(temperature));probs=torch.softmax(logits,-1);sv,si=torch.sort(probs,descending=True);cs=torch.cumsum(sv,-1);mask=cs>top_p;mask[...,0]=False;sv=sv.masked_fill(mask,0);sv=sv/sv.sum(-1,keepdim=True);idx=si.gather(-1,torch.multinomial(sv,1));ids=torch.cat((ids,idx),-1)
            if eos_id is not None and bool((idx==eos_id).all()):break
        return ids
