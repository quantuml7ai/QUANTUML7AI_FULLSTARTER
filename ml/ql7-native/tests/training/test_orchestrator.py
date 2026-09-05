import pathlib,sys,tempfile,unittest
ROOT=pathlib.Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'src'))
from ql7_native.training.orchestrator import STAGES,execute_stage_plan

class Orchestrator(unittest.TestCase):
    def test_receipt_chain_and_resume(self):
        calls=[]
        runners={stage:(lambda ctx,s=stage:(calls.append(s) or {'stage':s})) for stage in STAGES}
        with tempfile.TemporaryDirectory() as d:
            first=execute_stage_plan(STAGES,runners,receipt_dir=d,resume=True)
            self.assertEqual(first['stages'],len(STAGES));self.assertEqual(len(calls),len(STAGES))
            calls.clear();second=execute_stage_plan(STAGES,runners,receipt_dir=d,resume=True)
            self.assertEqual(second['finalReceiptHash'],first['finalReceiptHash']);self.assertEqual(calls,[])
if __name__=='__main__':unittest.main()
