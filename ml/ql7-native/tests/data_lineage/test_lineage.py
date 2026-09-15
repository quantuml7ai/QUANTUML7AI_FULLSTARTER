import pathlib,sys,unittest
ROOT=pathlib.Path(__file__).resolve().parents[2]; sys.path.insert(0,str(ROOT/'src'))
from ql7_native.data.lineage import DatasetRecord,validate_record,lineage_manifest
from ql7_native.data.contamination import assert_split_isolation
class T(unittest.TestCase):
 def test_lineage(self):
  r=DatasetRecord('1','public','ref','public-domain','en','general',normalized_hash='h1',near_duplicate_cluster='c1')
  self.assertTrue(validate_record(r)['ok']); self.assertTrue(lineage_manifest([r])['ok'])
 def test_leak(self):
  a={'split':'train','normalized_hash':'x','near_duplicate_cluster':'c'}; b={'split':'acceptance','normalized_hash':'x','near_duplicate_cluster':'c'}
  self.assertFalse(assert_split_isolation([a,b])['ok'])
if __name__=='__main__':unittest.main()
