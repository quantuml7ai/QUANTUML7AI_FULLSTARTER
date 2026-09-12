import os,pathlib,sys,tempfile,unittest
import torch
ROOT=pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'ml'/'ql7-native'/'src'))
sys.path.insert(0,str(ROOT/'services'/'ql7-model-runtime'))
from ql7_native.models import TransformerConfig,UnderstandingHeadConfig,QL7UnderstandingCore,QL7Generator,QL7Critic,QL7NeuralEditNormalizer
from ql7_native.tokenizer.codec import QL7Tokenizer
from ql7_native.release.architecture import expected_parameter_inventory,inventory_from_models
from ql7_native.release.build_manifest import build
from ql7_native.release.sign import sign_manifest
from ql7_native.release.promote import promote
from model_loader import ModelBundle

class RuntimeReleaseLoad(unittest.TestCase):
    def _bundle(self,root):
        cfg={'schema':'ql7.native.architecture-config','schemaVersion':1,'tokenizer':{'vocab_size':256,'algorithm':'byte_bpe','byte_fallback':True},'normalizer':{'vocab_size':384,'hidden':32},'understanding':{'vocab_size':256,'hidden_size':32,'layers':1,'heads':4,'kv_heads':2,'intermediate_size':64,'max_seq_len':64,'dropout':0.0,'rope_theta':10000.0,'activation_checkpointing':False},'understandingHeads':{'intents':4,'topics':5,'entity_labels':3,'discourse':2,'emotions':2,'safety':3,'locale_labels':2,'embedding_dim':16},'generator':{'vocab_size':256,'hidden_size':32,'layers':1,'heads':4,'kv_heads':2,'intermediate_size':64,'max_seq_len':64,'dropout':0.0,'rope_theta':10000.0,'activation_checkpointing':False},'critic':{'vocab_size':256,'hidden_size':32,'layers':1,'heads':4,'kv_heads':2,'intermediate_size':64,'max_seq_len':64,'dropout':0.0,'rope_theta':10000.0,'activation_checkpointing':False}}
        heads=UnderstandingHeadConfig(**cfg['understandingHeads'])
        models={'normalizer':QL7NeuralEditNormalizer(vocab_size=384,hidden=32),'understanding':QL7UnderstandingCore(TransformerConfig(**cfg['understanding']),heads),'generator':QL7Generator(TransformerConfig(**cfg['generator'])),'critic':QL7Critic(TransformerConfig(**cfg['critic']))}
        actual=inventory_from_models(models);self.assertEqual(actual['roles'],expected_parameter_inventory(cfg)['roles'])
        root=pathlib.Path(root);artifacts={}
        tok=root/'tokenizer.json';QL7Tokenizer().save(tok);artifacts['tokenizer']=tok
        for role,model in models.items():
            path=root/f'{role}.pt';torch.save(model.state_dict(),path);artifacts[role]=path
        candidate=build('TINY-RUNTIME',artifacts,architecture_config=cfg,parameter_inventory=actual,training_lineage_hash='lineage',calibration_artifact_hash='calibration')
        key=b'ql7-runtime-unit-key';sig=sign_manifest(candidate,key);evidence={k:{'ok':True} for k in ('lineage','calibration','acceptance','noEgress','rollback')}
        return promote(candidate,evidence,sig,key),key,artifacts
    def test_signed_bundle_loads_and_tamper_rejects(self):
        with tempfile.TemporaryDirectory() as d:
            manifest,key,artifacts=self._bundle(d);old=os.environ.get('QL7_MODEL_MANIFEST_HMAC_KEY');os.environ['QL7_MODEL_MANIFEST_HMAC_KEY']=key.hex()
            try:
                bundle=ModelBundle(d,manifest).load();self.assertEqual(bundle.tokenizer.vocab_size,256);self.assertIn('generator',bundle.models)
                artifacts['generator'].write_bytes(b'tampered')
                with self.assertRaisesRegex(RuntimeError,'generator_artifact_hash_mismatch'):ModelBundle(d,manifest).load()
            finally:
                if old is None:os.environ.pop('QL7_MODEL_MANIFEST_HMAC_KEY',None)
                else:os.environ['QL7_MODEL_MANIFEST_HMAC_KEY']=old
    def test_missing_runtime_verification_key_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            manifest,key,_=self._bundle(d);old=os.environ.pop('QL7_MODEL_MANIFEST_HMAC_KEY',None)
            try:
                with self.assertRaisesRegex(RuntimeError,'MODEL_PROMOTION_VERIFICATION_KEY_MISSING'):ModelBundle(d,manifest).load()
            finally:
                if old is not None:os.environ['QL7_MODEL_MANIFEST_HMAC_KEY']=old
if __name__=='__main__':unittest.main()
