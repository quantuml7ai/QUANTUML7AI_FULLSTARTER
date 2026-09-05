import pathlib,sys,tempfile,unittest
ROOT=pathlib.Path(__file__).resolve().parents[2]; sys.path.insert(0,str(ROOT/'src'))
from ql7_native.release.export import atomic_export
from ql7_native.release.promote import promote
class T(unittest.TestCase):
 def test_atomic_export(self):
  with tempfile.TemporaryDirectory() as d:
   a=pathlib.Path(d)/'a'; b=pathlib.Path(d)/'b'; a.write_bytes(b'ql7'); r=atomic_export(a,b); self.assertEqual(r['bytes'],3)
 def test_promotion_requires_evidence(self):
  with self.assertRaises(ValueError): promote({}, {}, 'sig')
if __name__=='__main__':unittest.main()
