import {spawn} from 'node:child_process'
import readline from 'node:readline'
import crypto from 'node:crypto'
export class Ql7OracleProcessClient{
 constructor({workerPath='scripts/ql7-support/oracle-worker.mjs',cwd=process.cwd()}={}){this.seq=0;this.pending=new Map();this.child=spawn(process.execPath,[workerPath],{cwd,stdio:['pipe','pipe','pipe'],env:{PATH:process.env.PATH,NODE_OPTIONS:''}});this.stderr='';this.child.stderr.on('data',b=>{this.stderr=(this.stderr+String(b)).slice(-12000)});this.rl=readline.createInterface({input:this.child.stdout,crlfDelay:Infinity});this.rl.on('line',line=>{try{const msg=JSON.parse(line),p=this.pending.get(msg.id);if(!p)return;this.pending.delete(msg.id);msg.ok?p.resolve(msg.result):p.reject(new Error(`oracle_process_failed:${msg.error}`))}catch{}});this.child.on('exit',(code)=>{for(const p of this.pending.values())p.reject(new Error(`oracle_process_exit:${code}:${this.stderr}`));this.pending.clear()})}
 evaluate(payload){const id=`oracle:${process.pid}:${++this.seq}:${crypto.randomBytes(6).toString('hex')}`;return new Promise((resolve,reject)=>{this.pending.set(id,{resolve,reject});this.child.stdin.write(`${JSON.stringify({id,payload})}\n`)})}
 async close(){if(!this.child)return;this.child.stdin.end();await new Promise(resolve=>{const t=setTimeout(()=>{this.child.kill('SIGKILL');resolve()},2000);this.child.once('exit',()=>{clearTimeout(t);resolve()})})}
}
