import hashlib,json,time
def receipt(role,release_id,request,output):
 b={'schema':'ql7.native-model-receipt','schemaVersion':1,'modelRole':role,'releaseId':release_id,'requestHash':hashlib.sha256(json.dumps(request,sort_keys=True).encode()).hexdigest(),'outputHash':hashlib.sha256(json.dumps(output,sort_keys=True).encode()).hexdigest(),'createdAtMs':int(time.time()*1000)};b['receiptHash']=hashlib.sha256(json.dumps(b,sort_keys=True).encode()).hexdigest();return b
