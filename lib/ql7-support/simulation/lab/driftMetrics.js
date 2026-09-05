export function jsDivergence(p=[],q=[]){let v=0;
const n=Math.max(p.length,q.length);
for(let i=0;
i<n;
i++){const a=Math.max(1e-12,Number(p[i]||0)),b=Math.max(1e-12,Number(q[i]||0)),m=(a+b)/2;
v+=0.5*a*Math.log(a/m)+0.5*b*Math.log(b/m)}return v}
export function buildQl7LabDriftMetrics({baseline={},current={}}={}){return Object.freeze({featureJs:jsDivergence(baseline.featureDistribution||[],current.featureDistribution||[]),posteriorCalibrationDelta:Number(current.ece||0)-Number(baseline.ece||0),abstentionDelta:Number(current.abstentionRate||0)-Number(baseline.abstentionRate||0),providerLanguageDelta:Number(current.providerFailureRate||0)-Number(baseline.providerFailureRate||0),noveltyCollisionDelta:Number(current.noveltyCollisionRate||0)-Number(baseline.noveltyCollisionRate||0),memoryTransitionDelta:Number(current.memoryFailureRate||0)-Number(baseline.memoryFailureRate||0),safetyChallengeDelta:Number(current.safetyFalsePositiveRate||0)-Number(baseline.safetyFalsePositiveRate||0)})}
