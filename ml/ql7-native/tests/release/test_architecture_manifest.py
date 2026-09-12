import pathlib,sys,tempfile,unittest
ROOT=pathlib.Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'src'))
from ql7_native.release.architecture import load_architecture_config,expected_parameter_inventory
from ql7_native.release.build_manifest import build
from ql7_native.release.sign import sign_manifest
from ql7_native.release.promote import promote
from ql7_native.release.validate import validate_manifest

class ReleaseArchitecture(unittest.TestCase):
    def test_target_inventory_is_exact_and_promotable(self):
        architecture=load_architecture_config(ROOT/'configs'/'architecture.production.json')
        inventory=expected_parameter_inventory(architecture)
        self.assertEqual(inventory['roles']['generator'],3473083392)
        self.assertEqual(inventory['total'],4479320953)
        with tempfile.TemporaryDirectory() as d:
            d=pathlib.Path(d);artifacts={}
            for role in ('tokenizer','normalizer','understanding','generator','critic'):
                p=d/f'{role}.bin';p.write_bytes(('ql7-'+role).encode());artifacts[role]=p
            candidate=build('TEST',artifacts,architecture_config=architecture,parameter_inventory=inventory,training_lineage_hash='lineage',calibration_artifact_hash='calibration')
            key=b'ql7-unit-test-key';sig=sign_manifest(candidate,key)
            evidence={k:{'ok':True} for k in ('lineage','calibration','acceptance','noEgress','rollback')}
            promoted=promote(candidate,evidence,sig,key)
            self.assertEqual(promoted['promotionStatus'],'PRODUCTION_PROMOTED')
            self.assertTrue(validate_manifest(promoted)['ok'])
    def test_production_build_rejects_missing_inventory(self):
        architecture=load_architecture_config(ROOT/'configs'/'architecture.production.json')
        with tempfile.TemporaryDirectory() as d:
            d=pathlib.Path(d);artifacts={}
            for role in ('tokenizer','normalizer','understanding','generator','critic'):
                p=d/f'{role}.bin';p.write_bytes(b'x');artifacts[role]=p
            with self.assertRaises(ValueError):
                build('BAD',artifacts,promotion_status='PRODUCTION_PROMOTED',architecture_config=architecture,training_lineage_hash='x',calibration_artifact_hash='y')
if __name__=='__main__':unittest.main()
