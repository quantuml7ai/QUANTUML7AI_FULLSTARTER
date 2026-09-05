import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawn, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const argv = process.argv.slice(2)
const isQuickMode = argv.includes('--quick')
const failFast = argv.includes('--fail-fast')
const shouldRunDeepDiagnosticGate = !isQuickMode && argv.includes('--deep')
const immutablePublicMode = String(process.env.QL7_SUPPORT_IMMUTABLE_PUBLIC || '').trim() === '1'
const forceRuntimeCritical = String(process.env.QL7_TEST_CODEX_FORCE_RUNTIME_CRITICAL || '').trim() === '1'
const stageTimeoutMs = Math.max(30_000, Number(process.env.QL7_TEST_CODEX_STAGE_TIMEOUT_MS || 15 * 60_000))
const maxCaptureBytes = Math.max(256 * 1024, Number(process.env.QL7_TEST_CODEX_MAX_CAPTURE_BYTES || 8 * 1024 * 1024))
const reportRoot = path.resolve(process.cwd(), process.env.QL7_TEST_CODEX_REPORT_ROOT || process.env.QL7_SUPPORT_EVIDENCE_ROOT || 'reports/ql7-support-patch/test-codex')
fs.mkdirSync(reportRoot, { recursive: true })
fs.mkdirSync(path.join(reportRoot, 'stdout'), { recursive: true })
fs.mkdirSync(path.join(reportRoot, 'stderr'), { recursive: true })
const reportPath = path.join(reportRoot, 'test-codex.report.json')
const commandEnv = { ...process.env, CI: process.env.CI || 'true' }
const tsconfigPath = path.join(process.cwd(), 'tsconfig.json')
const require = createRequire(import.meta.url)
const { loadGovernance, matchesSensitiveRuntimePath } = require('./runtime-governance.js')
const sha = (v) => crypto.createHash('sha256').update(String(v ?? '')).digest('hex')
const append = (a,b) => (a + String(b || '')).slice(-maxCaptureBytes)
const safeName = (s) => String(s).toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'') || 'stage'

function detectChangedFiles() {
  const result = spawnSync('git', ['status', '--short'], { cwd: process.cwd(), encoding: 'utf8', env: commandEnv })
  if (result.error || typeof result.stdout !== 'string') return []
  return result.stdout.split(/\r?\n/).map((line)=>String(line||'').replace(/\r$/,'')).filter((line)=>line.trim()).map((line)=>{
    const rawPath=line.slice(3).trim(); return rawPath.includes(' -> ')?rawPath.split(' -> ').pop():rawPath
  }).filter(Boolean)
}

const governance=loadGovernance(process.cwd())
const changedFiles=detectChangedFiles()
const shouldRunRuntimeCriticalGate = forceRuntimeCritical || (!isQuickMode && changedFiles.some((rel)=>matchesSensitiveRuntimePath(rel,governance)))
console.log(`\n[test:codex] changed files detected: ${changedFiles.length}`)
console.log(`[test:codex] runtime-critical gate: ${shouldRunRuntimeCriticalGate?'enabled':'skipped'}`)
console.log(`[test:codex] forced runtime-critical: ${forceRuntimeCritical?'yes':'no'}`)
console.log(`[test:codex] deep diagnostic gate: ${shouldRunDeepDiagnosticGate?'enabled':'skipped'}`)
console.log(`[test:codex] aggregate failures: ${failFast?'no (--fail-fast)':'yes'}`)
console.log(`[test:codex] stage timeout: ${stageTimeoutMs}ms`)
console.log(`[test:codex] evidence: ${reportRoot}`)

const stages = [
 ['Environment','verify:env'],['Documentation Contracts','verify:docs'],['Static Audits L0','verify:audits:fast'],
 ['QL7 Support Premium Canonical Closure','verify:ql7-support:premium'],['Lint','lint'],['Typecheck','typecheck'],
 ['Project Contracts','test:contracts'],['Unit Tests','test:unit'],['Component Tests','test:component'],
]
if(shouldRunRuntimeCriticalGate) stages.push(
 ['Forum Runtime Gate L1','verify:forum:runtime'],['Auth Fanout Gate L1','verify:auth:fanout'],['Route Budget Gate L1','verify:route:budgets'],
 ['Startup Budget Gate L1','verify:startup:budgets'],['Ads Runtime Gate L1','verify:ads:runtime'],
)
if(!isQuickMode) stages.push(['Integration Tests','test:integration'],['Smoke Tests','test:smoke'])
if(shouldRunDeepDiagnosticGate) stages.push(['Static Audits L2','verify:audits:deep'],['Media HAR Gate L2','verify:media:har'],['Media Heap Gate L2','verify:media:heap'],['Mobile Matrix Gate L2','verify:mobile:matrix'],['Exchange Widgets Gate L2','verify:exchange:widgets'])
if(!isQuickMode) stages.push(['Production Build','build'])

let results=[]
function failureDiagnostics(stdout='',stderr='',error=''){
  const combined=`${stderr}\n${stdout}\n${error}`.split(/\r?\n/).map(s=>s.trim()).filter(Boolean)
  const interesting=combined.filter(line=>/(fail|error|timeout|timed out|assert|exception|not found|missing|mismatch|fatal)/i.test(line))
  return [...new Set(interesting)].slice(-120)
}
function checkpoint(complete=false){
  const failures=results.filter(r=>r.status==='FAIL')
  const report={schema:'ql7.test-codex.aggregate-report',schemaVersion:'2.0.0',mode:isQuickMode?'quick':'full',complete,ok:complete&&failures.length===0,failFast,forceRuntimeCritical,stageTimeoutMs,changedFiles,runtimeCritical:shouldRunRuntimeCriticalGate,deepDiagnostic:shouldRunDeepDiagnosticGate,stages:results,failures,generatedAt:new Date().toISOString()}
  fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n','utf8')
  return report
}
function pnpmInvocation(script){
  const effective=script==='build'&&immutablePublicMode?'build:ql7-support:readonly':script
  if(process.platform==='win32') return {exe:'cmd.exe',args:['/d','/s','/c',`pnpm run ${effective}`],effective}
  return {exe:'pnpm',args:['run',effective],effective}
}
async function runStage(label,script,index,total){
  const started=Date.now(); const {exe,args,effective}=pnpmInvocation(script)
  const base=safeName(`${String(index+1).padStart(2,'0')}-${effective}`)
  let stdout='',stderr='',timedOut=false,spawnError='',settled=false
  const originalTsconfig=(effective==='build'||effective==='build:ql7-support:readonly')&&fs.existsSync(tsconfigPath)?fs.readFileSync(tsconfigPath,'utf8'):null
  console.log(`\n[${index+1}/${total}] ${label}`); console.log(`> ${exe} ${args.join(' ')}`)
  const row=await new Promise(resolve=>{
    let child
    try{child=spawn(exe,args,{cwd:process.cwd(),env:commandEnv,shell:false,stdio:['ignore','pipe','pipe']})}catch(error){spawnError=String(error?.message||error);return resolve(null)}
    child.stdout?.on('data',d=>{stdout=append(stdout,d);process.stdout.write(d)})
    child.stderr?.on('data',d=>{stderr=append(stderr,d);process.stderr.write(d)})
    const done=(code,signal,error='')=>{if(settled)return;settled=true;clearTimeout(timer);resolve({code:Number.isInteger(code)?code:1,signal:String(signal||''),error:String(error||spawnError)})}
    child.on('error',e=>done(1,'',e?.message||e)); child.on('close',(code,signal)=>done(code,signal))
    const timer=setTimeout(()=>{timedOut=true;try{child.kill('SIGTERM')}catch{};setTimeout(()=>{if(!settled)try{child.kill('SIGKILL')}catch{}},2500).unref?.()},stageTimeoutMs)
  })
  try{if(originalTsconfig!==null&&fs.existsSync(tsconfigPath)&&fs.readFileSync(tsconfigPath,'utf8')!==originalTsconfig)fs.writeFileSync(tsconfigPath,originalTsconfig,'utf8')}catch{}
  const exitCode=row?.code??1,signal=row?.signal||'',error=row?.error||spawnError
  const stdoutPath=path.join(reportRoot,'stdout',`${base}.log`), stderrPath=path.join(reportRoot,'stderr',`${base}.log`)
  fs.writeFileSync(stdoutPath,stdout,'utf8'); fs.writeFileSync(stderrPath,stderr,'utf8')
  return {label,script,effectiveScript:effective,command:[exe,...args],status:exitCode===0&&!timedOut&&!error?'PASS':'FAIL',exitCode,signal,timedOut,timeoutMs:stageTimeoutMs,error,durationMs:Date.now()-started,stdoutPath:path.relative(process.cwd(),stdoutPath).replace(/\\/g,'/'),stderrPath:path.relative(process.cwd(),stderrPath).replace(/\\/g,'/'),stdoutSha256:sha(stdout),stderrSha256:sha(stderr),failureDiagnostics:failureDiagnostics(stdout,stderr,error)}
}

for(let i=0;i<stages.length;i+=1){
  const [label,script]=stages[i]; const row=await runStage(label,script,i,stages.length); results.push(row); checkpoint(false)
  if(row.status==='FAIL'){console.error(`\n[FAIL] ${label} (exit=${row.exitCode}${row.timedOut?', timeout':''})`); if(failFast)break}
}
const complete=results.length===stages.length||failFast
const report=checkpoint(complete)
console.log(`\n[test:codex] completed stages: ${results.length}/${stages.length}; failures: ${report.failures.length}`)
console.log(`[test:codex] report: ${reportPath}`)
if(report.ok) console.log(`\n[SUCCESS] pnpm test:codex completed (${isQuickMode?'quick':'full'} mode)`)
else { console.error(`\n[FAIL] pnpm test:codex found ${report.failures.length} failing stage(s)`); process.exitCode=1 }
