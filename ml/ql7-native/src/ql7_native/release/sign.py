import hashlib,hmac,json
def sign_manifest(manifest:dict,key:bytes)->str:return hmac.new(key,json.dumps(manifest,sort_keys=True,separators=(',',':')).encode(),hashlib.sha256).hexdigest()
def verify_manifest(manifest,key,signature):return hmac.compare_digest(sign_manifest(manifest,key),signature)
