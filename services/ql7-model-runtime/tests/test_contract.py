import pathlib, unittest, sys
ROOT=pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'ml'/'ql7-native'/'src'))
class RuntimeContract(unittest.TestCase):
    def test_training_not_inside_runtime_service(self):
        service=ROOT/'services'/'ql7-model-runtime'
        names={p.name for p in service.rglob('*.py')}
        self.assertFalse({'optimizer.py','trainer.py','dataset_writer.py'} & names)
    def test_runtime_files_exist(self):
        required={'server.py','schemas.py','model_loader.py','batching.py','health.py'}
        self.assertTrue(required.issubset({p.name for p in (ROOT/'services'/'ql7-model-runtime').glob('*.py')}))
if __name__=='__main__': unittest.main()
