import re
PATTERNS=[re.compile(r'\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b'),re.compile(r'\b(?:0x)?[0-9a-fA-F]{40,64}\b')]
def redact(text:str)->str:
 out=text
 for p in PATTERNS:out=p.sub('[REDACTED]',out)
 return out
