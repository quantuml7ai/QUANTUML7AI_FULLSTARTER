export function ql7RatingScore(sum=0,tau=1){const t=Math.max(.0001,Number(tau||1));return 50+50*Math.tanh(Number(sum||0)/t)}
