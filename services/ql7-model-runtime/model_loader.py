import copy,hashlib,json,os,sys,torch
from pathlib import Path

class ModelBundle:
    def __init__(self,root,manifest):
        self.root=Path(root);self.manifest=manifest;sys.path.insert(0,str(self.root/'ml/ql7-native/src'));self.models={};self.tokenizer=None
    def require_promoted(self):
        if self.manifest.get('promotionStatus')!='PRODUCTION_PROMOTED':raise RuntimeError('MODEL_BEHAVIOR_NOT_PROVEN')
        receipt=self.manifest.get('promotionReceipt') or {}
        if not receipt.get('verified') or not receipt.get('signature'):raise RuntimeError('MODEL_PROMOTION_SIGNATURE_MISSING')
        key_raw=os.environ.get('QL7_MODEL_MANIFEST_HMAC_KEY','')
        if not key_raw:raise RuntimeError('MODEL_PROMOTION_VERIFICATION_KEY_MISSING')
        try:key=bytes.fromhex(key_raw)
        except ValueError:key=key_raw.encode('utf-8')
        candidate=copy.deepcopy(self.manifest);candidate.pop('promotionReceipt',None);candidate['promotionStatus']=receipt.get('signedCandidatePromotionStatus')
        sys.path.insert(0,str(self.root/'ml/ql7-native/src'))
        from ql7_native.release.architecture import sha_json
        from ql7_native.release.sign import verify_manifest
        if receipt.get('signedCandidateHash')!=sha_json(candidate):raise RuntimeError('MODEL_PROMOTION_CANDIDATE_HASH_MISMATCH')
        if not verify_manifest(candidate,key,receipt['signature']):raise RuntimeError('MODEL_PROMOTION_SIGNATURE_INVALID')
    def _artifact_path(self,role):
        meta=self.manifest.get(role,{}) or {};rel=meta.get('artifact') or meta.get('path')
        if not rel:raise RuntimeError(f'{role}_artifact_missing')
        p=(self.root/rel).resolve()
        try:p.relative_to(self.root.resolve())
        except ValueError:raise RuntimeError(f'{role}_artifact_outside_root')
        if not p.is_file():raise RuntimeError(f'{role}_artifact_missing')
        expected=(meta.get('sha256') or meta.get('weightsHash') or '').lower()
        if not expected:raise RuntimeError(f'{role}_artifact_hash_missing')
        actual=hashlib.sha256(p.read_bytes()).hexdigest()
        if actual!=expected:raise RuntimeError(f'{role}_artifact_hash_mismatch')
        if meta.get('bytes') is not None and int(meta['bytes'])!=p.stat().st_size:raise RuntimeError(f'{role}_artifact_bytes_mismatch')
        return p
    def _architecture(self):
        from ql7_native.release.architecture import expected_parameter_inventory,sha_json,validate_architecture_config
        cfg=self.manifest.get('architectureConfig')
        if not cfg:raise RuntimeError('architecture_config_missing')
        try:validate_architecture_config(cfg)
        except Exception as e:raise RuntimeError('architecture_config_invalid:'+str(e))
        expected_hash=self.manifest.get('architectureConfigHash')
        if not expected_hash or expected_hash!=sha_json(cfg):raise RuntimeError('architecture_config_hash_mismatch')
        inventory=self.manifest.get('parameterInventory') or {}
        inventory_hash=self.manifest.get('parameterInventoryHash')
        if not inventory_hash or inventory_hash!=sha_json(inventory):raise RuntimeError('parameter_inventory_hash_mismatch')
        expected=expected_parameter_inventory(cfg)
        for role,count in expected['roles'].items():
            if int((inventory.get('roles') or {}).get(role,-1))!=int(count):raise RuntimeError(f'parameter_inventory_declared_mismatch:{role}')
        return cfg,inventory,expected
    def _load_state(self,role,model):
        p=self._artifact_path(role);state=torch.load(p,map_location='cpu',weights_only=True);model.load_state_dict(state,strict=True);model.eval();return model
    @staticmethod
    def _count(model):return sum(int(p.numel()) for p in model.parameters())
    def load(self):
        self.require_promoted();cfg,inventory,expected=self._architecture()
        from ql7_native.models import TransformerConfig,UnderstandingHeadConfig,QL7UnderstandingCore,QL7Generator,QL7Critic,QL7Normalizer,QL7NeuralEditNormalizer
        from ql7_native.tokenizer.codec import QL7Tokenizer
        tokenizer_path=self._artifact_path('tokenizer');self.tokenizer=QL7Tokenizer.load(tokenizer_path)
        tokenizer_expected=int((cfg.get('tokenizer') or {}).get('vocab_size',0))
        if tokenizer_expected and self.tokenizer.vocab_size!=tokenizer_expected:raise RuntimeError('tokenizer_vocab_size_mismatch')
        heads_cfg=cfg.get('understandingHeads') or {};heads=UnderstandingHeadConfig(**heads_cfg)
        u=TransformerConfig(**cfg['understanding']);g=TransformerConfig(**cfg['generator']);c=TransformerConfig(**cfg['critic'])
        self.models['understanding']=self._load_state('understanding',QL7UnderstandingCore(u,heads))
        self.models['generator']=self._load_state('generator',QL7Generator(g))
        self.models['critic']=self._load_state('critic',QL7Critic(c))
        ncfg=cfg.get('normalizer') or {};neural=QL7NeuralEditNormalizer(vocab_size=int(ncfg.get('vocab_size',384)),hidden=int(ncfg.get('hidden',256)))
        neural=self._load_state('normalizer',neural);self.models['normalizer']=QL7Normalizer(model=neural)
        for role in ('normalizer','understanding','generator','critic'):
            model=neural if role=='normalizer' else self.models[role]
            actual=self._count(model);declared=int((inventory.get('roles') or {}).get(role,-1));expected_count=int(expected['roles'][role])
            if actual!=declared or actual!=expected_count:raise RuntimeError(f'parameter_inventory_runtime_mismatch:{role}:{actual}:{declared}:{expected_count}')
        return self
    def get(self,role):
        if not self.models:self.load()
        return self.models[role]
