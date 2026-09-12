export function ql7EvidenceQuality({sourceReliability=0,freshness=0,coverage=0}={}){return Math.max(0,Math.min(1,Number(sourceReliability)*Number(freshness)*Number(coverage)))}
