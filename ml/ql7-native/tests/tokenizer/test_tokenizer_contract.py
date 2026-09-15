import pathlib,sys,unittest
ROOT=pathlib.Path(__file__).resolve().parents[2]; sys.path.insert(0,str(ROOT/'src'))
from ql7_native.eval.tokenizer import fertility
from ql7_native.data.sampling import temperature_locale_distribution
class T(unittest.TestCase):
 def test_fertility(self): self.assertGreater(fertility([4,8],[2,4])['meanFertility'],0)
 def test_sampling(self): self.assertAlmostEqual(sum(temperature_locale_distribution({'en':100,'uk':10},.5).values()),1.0,places=8)
if __name__=='__main__':unittest.main()
