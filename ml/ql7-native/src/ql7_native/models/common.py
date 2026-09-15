from dataclasses import dataclass
import math
import torch
from torch import nn
import torch.nn.functional as F

@dataclass(frozen=True)
class TransformerConfig:
    vocab_size:int=81920; hidden_size:int=768; layers:int=12; heads:int=12; kv_heads:int=4; intermediate_size:int=2048; max_seq_len:int=4096; dropout:float=0.0; rope_theta:float=10000.0; activation_checkpointing:bool=False
    def validate(self):
        if self.hidden_size%self.heads: raise ValueError('hidden_size_must_divide_heads')
        if self.heads%self.kv_heads: raise ValueError('heads_must_divide_kv_heads')
        return self

class RMSNorm(nn.Module):
    def __init__(self,dim,eps=1e-6): super().__init__(); self.weight=nn.Parameter(torch.ones(dim)); self.eps=eps
    def forward(self,x): return x*torch.rsqrt(x.pow(2).mean(-1,keepdim=True)+self.eps)*self.weight

def rotate_half(x):
    a,b=x.chunk(2,dim=-1); return torch.cat((-b,a),dim=-1)

def rope(q,k,offset=0,theta=10000.0):
    d=q.shape[-1]; pos=torch.arange(offset,offset+q.shape[-2],device=q.device,dtype=torch.float32); inv=1.0/(theta**(torch.arange(0,d,2,device=q.device,dtype=torch.float32)/d)); freq=torch.outer(pos,inv); emb=torch.cat((freq,freq),-1); c,s=emb.cos().to(q.dtype)[None,None],emb.sin().to(q.dtype)[None,None]; return q*c+rotate_half(q)*s,k*c+rotate_half(k)*s

class GQAAttention(nn.Module):
    def __init__(self,cfg:TransformerConfig,causal=False):
        super().__init__(); self.cfg=cfg; self.causal=causal; d=cfg.hidden_size//cfg.heads; self.d=d
        self.q=nn.Linear(cfg.hidden_size,cfg.heads*d,bias=False); self.k=nn.Linear(cfg.hidden_size,cfg.kv_heads*d,bias=False); self.v=nn.Linear(cfg.hidden_size,cfg.kv_heads*d,bias=False); self.o=nn.Linear(cfg.heads*d,cfg.hidden_size,bias=False)
    def forward(self,x,attention_mask=None):
        b,t,_=x.shape; q=self.q(x).view(b,t,self.cfg.heads,self.d).transpose(1,2); k=self.k(x).view(b,t,self.cfg.kv_heads,self.d).transpose(1,2); v=self.v(x).view(b,t,self.cfg.kv_heads,self.d).transpose(1,2); q,k=rope(q,k,theta=self.cfg.rope_theta)
        if self.cfg.kv_heads!=self.cfg.heads: rep=self.cfg.heads//self.cfg.kv_heads; k=k.repeat_interleave(rep,1); v=v.repeat_interleave(rep,1)
        mask=None
        if attention_mask is not None: mask=(attention_mask[:,None,None,:]==0)
        y=F.scaled_dot_product_attention(q,k,v,attn_mask=None if mask is None else torch.zeros_like(mask,dtype=q.dtype).masked_fill(mask,float('-inf')),dropout_p=self.cfg.dropout if self.training else 0.0,is_causal=self.causal)
        return self.o(y.transpose(1,2).contiguous().view(b,t,-1))

class SwiGLU(nn.Module):
    def __init__(self,cfg): super().__init__(); self.g=nn.Linear(cfg.hidden_size,cfg.intermediate_size,bias=False); self.u=nn.Linear(cfg.hidden_size,cfg.intermediate_size,bias=False); self.d=nn.Linear(cfg.intermediate_size,cfg.hidden_size,bias=False)
    def forward(self,x): return self.d(F.silu(self.g(x))*self.u(x))

class TransformerBlock(nn.Module):
    def __init__(self,cfg,causal=False): super().__init__(); self.n1=RMSNorm(cfg.hidden_size); self.a=GQAAttention(cfg,causal); self.n2=RMSNorm(cfg.hidden_size); self.f=SwiGLU(cfg)
    def forward(self,x,attention_mask=None): x=x+self.a(self.n1(x),attention_mask); return x+self.f(self.n2(x))

class TransformerBackbone(nn.Module):
    def __init__(self,cfg:TransformerConfig,causal=False): super().__init__(); self.cfg=cfg.validate(); self.emb=nn.Embedding(cfg.vocab_size,cfg.hidden_size); self.blocks=nn.ModuleList([TransformerBlock(cfg,causal) for _ in range(cfg.layers)]); self.norm=RMSNorm(cfg.hidden_size)
    def forward(self,input_ids,attention_mask=None):
        x=self.emb(input_ids)
        for block in self.blocks:
            if self.cfg.activation_checkpointing and self.training:
                from torch.utils.checkpoint import checkpoint
                x=checkpoint(lambda hidden, blk=block: blk(hidden,attention_mask),x,use_reentrant=False)
            else:
                x=block(x,attention_mask)
        return self.norm(x)

def masked_mean(x,mask=None):
    if mask is None:return x.mean(1)
    w=mask.to(x.dtype).unsqueeze(-1);return (x*w).sum(1)/w.sum(1).clamp_min(1)
