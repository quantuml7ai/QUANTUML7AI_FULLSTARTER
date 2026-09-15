import re,unicodedata,torch
from torch import nn
PROTECTED=[re.compile(x,re.I) for x in [r'https?://\S+',r'\b[0-9a-f]{64}\b',r'\b0x[0-9a-f]{40}\b',r'\b[^\s@]+@[^\s@]+\.[^\s@]+\b']]
class QL7NeuralEditNormalizer(nn.Module):
    def __init__(self,vocab_size=384,hidden=256):super().__init__();self.emb=nn.Embedding(vocab_size,hidden);self.encoder=nn.GRU(hidden,hidden,batch_first=True,bidirectional=True);self.edit_head=nn.Linear(hidden*2,4);self.char_head=nn.Linear(hidden*2,vocab_size)
    def forward(self,input_ids):h,_=self.encoder(self.emb(input_ids));return {'edit_logits':self.edit_head(h),'char_logits':self.char_head(h)}
class QL7Normalizer:
    def __init__(self,model=None):self.model=model
    def protected_spans(self,text):return sorted([(m.start(),m.end(),m.group(0)) for p in PROTECTED for m in p.finditer(text)])
    def normalize(self,text:str):
        original=str(text);nfkc=unicodedata.normalize('NFKC',original);clean=re.sub(r'[\u200b-\u200d\u2060\ufeff]','',nfkc);spans=self.protected_spans(original);return {'original':original,'protectedSpans':spans,'candidates':[{'candidateText':clean,'transformType':'unicode_nfkc_zero_width','probability':1.0,'neuralGeneralizationAvailable':self.model is not None}]}
