import pathlib,sys,tempfile,unittest
import torch
from torch.utils.data import Dataset
ROOT=pathlib.Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'src'))
from ql7_native.models import TransformerConfig,QL7Generator
from ql7_native.training.core import train_loop

class TinyDataset(Dataset):
    def __init__(self):
        self.rows=[]
        for i in range(12):
            ids=torch.tensor([(i+j)%32 for j in range(16)],dtype=torch.long)
            self.rows.append({'input_ids':ids,'labels':ids.clone()})
    def __len__(self):return len(self.rows)
    def __getitem__(self,i):return self.rows[i]

def model():
    return QL7Generator(TransformerConfig(vocab_size=64,hidden_size=64,layers=2,heads=4,kv_heads=2,intermediate_size=128,max_seq_len=16,activation_checkpointing=True))

class TrainingResume(unittest.TestCase):
    def test_checkpoint_resume_scheduler_accumulation(self):
        data=TinyDataset()
        with tempfile.TemporaryDirectory() as d:
            d=pathlib.Path(d);a=d/'a';b=d/'b'
            r1=train_loop(model(),data,epochs=4,batch_size=2,lr=1e-3,weight_decay=0,device='cpu',gradient_accumulation_steps=2,max_steps=3,warmup_steps=1,checkpoint_dir=a,checkpoint_every_steps=2,seed=991,stage='unit')
            self.assertEqual(r1['steps'],3);self.assertTrue((a/'latest.pt').is_file())
            r2=train_loop(model(),data,epochs=4,batch_size=2,lr=1e-3,weight_decay=0,device='cpu',gradient_accumulation_steps=2,max_steps=5,warmup_steps=1,checkpoint_dir=b,resume_from=a/'latest.pt',seed=991,stage='unit')
            self.assertTrue(r2['resumed']);self.assertEqual(r2['steps'],5);self.assertTrue((b/'latest.pt').is_file());self.assertTrue(torch.isfinite(torch.tensor(r2['lastLoss'])))
if __name__=='__main__':unittest.main()
