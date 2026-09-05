import hashlib
def stable_split(key:str)->str:
 x=int(hashlib.sha256(key.encode()).hexdigest()[:8],16)%10000
 return 'train' if x<9000 else 'calibration' if x<9500 else 'acceptance' if x<9850 else 'holdout'
