import hashlib,unicodedata,re
def normalized_text(s:str)->str:return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).casefold()).strip()
def normalized_hash(s:str)->str:return hashlib.sha256(normalized_text(s).encode()).hexdigest()
def dedupe(rows):
 seen=set();out=[]
 for r in rows:
  h=normalized_hash(str(r));
  if h not in seen:seen.add(h);out.append(r)
 return out
