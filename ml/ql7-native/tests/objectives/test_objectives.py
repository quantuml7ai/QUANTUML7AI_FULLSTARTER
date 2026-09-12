import pathlib,sys,unittest
ROOT=pathlib.Path(__file__).resolve().parents[2]; sys.path.insert(0,str(ROOT/'src'))
class T(unittest.TestCase):
 def test_modules_import(self):
  try:
   import torch
  except Exception: self.skipTest('torch_not_installed')
  from ql7_native.objectives.contrastive import info_nce
  from ql7_native.objectives.dpo import dpo_loss
  a=torch.randn(2,8); p=torch.randn(2,8); n=torch.randn(2,3,8)
  self.assertTrue(info_nce(a,p,n).isfinite())
  z=torch.tensor([1.0,1.1]); self.assertTrue(dpo_loss(z,z-.2,z-.1,z-.2).isfinite())
if __name__=='__main__':unittest.main()
