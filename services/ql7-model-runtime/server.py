#!/usr/bin/env python3
import argparse,json,os,time,hashlib,torch
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from manifest_loader import load
from model_loader import ModelBundle
from security import assert_private_bind
from health import health
from schemas import validate_request

def digest(v):return hashlib.sha256(json.dumps(v,sort_keys=True,ensure_ascii=False,default=str).encode()).hexdigest()
class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args): pass
    def _json(self,status,obj):raw=json.dumps(obj,ensure_ascii=False,default=str).encode();self.send_response(status);self.send_header('content-type','application/json; charset=utf-8');self.send_header('content-length',str(len(raw)));self.end_headers();self.wfile.write(raw)
    def do_GET(self):
        if self.path=='/health':return self._json(200,health(self.server.manifest))
        if self.path=='/manifest':return self._json(200,{k:v for k,v in self.server.manifest.items() if not str(k).startswith('_')})
        return self._json(404,{'ok':False})
    def do_POST(self):
        method=self.path.strip('/');n=min(int(self.headers.get('content-length','0') or 0),2_000_000);data=validate_request(json.loads(self.rfile.read(n) or b'{}'),method);started=time.time()
        try:
            self.server.bundle.require_promoted()
            if method=='normalize':out=self.server.bundle.get('normalizer').normalize(data.get('text',''))
            else:
                ids=torch.tensor([data.get('input_ids',[])],dtype=torch.long);mask=torch.ones_like(ids)
                if ids.numel()==0:raise ValueError('input_ids_required')
                if method in {'understand','encode','safety','rerank'}:
                    raw=self.server.bundle.get('understanding').infer_tensors(ids,mask);out={k:(v.detach().cpu().tolist() if hasattr(v,'detach') else v) for k,v in raw.items() if k!='hidden'}
                elif method=='generate':
                    gen=self.server.bundle.get('generator').generate_ids(ids,max_new_tokens=int(data.get('max_new_tokens',128)),temperature=float(data.get('temperature',.7)),top_p=float(data.get('top_p',.9)),eos_id=data.get('eos_id'));out={'token_ids':gen[0].tolist()}
                elif method=='critique':out={k:v.detach().cpu().tolist() for k,v in self.server.bundle.get('critic').score(ids,mask).items()}
                else:raise ValueError('method_not_allowed')
            receipt={'ok':True,'method':method,'releaseId':self.server.manifest.get('releaseId'),'latencyMs':round((time.time()-started)*1000,3),'inputHash':digest(data),'outputHash':digest(out)};return self._json(200,{**receipt,'output':out})
        except RuntimeError as e:
            if str(e)=='MODEL_BEHAVIOR_NOT_PROVEN':return self._json(503,{'ok':False,'error':'MODEL_BEHAVIOR_NOT_PROVEN'})
            return self._json(500,{'ok':False,'error':str(e)})
        except Exception as e:return self._json(400,{'ok':False,'error':str(e)})
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--root',default=os.environ.get('QL7_PROJECT_ROOT','.'));ap.add_argument('--host',default='127.0.0.1');ap.add_argument('--port',type=int,default=17471);a=ap.parse_args();assert_private_bind(a.host);manifest=load(a.root);srv=ThreadingHTTPServer((a.host,a.port),Handler);srv.manifest=manifest;srv.bundle=ModelBundle(a.root,manifest);srv.serve_forever()
if __name__=='__main__':main()
