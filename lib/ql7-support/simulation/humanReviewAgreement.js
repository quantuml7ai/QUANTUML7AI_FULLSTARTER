export {cohenKappa,adjudicateReviews} from './lab/reviewAgreement.js'
export const QL7_SUPPORT_HUMAN_REVIEW_AGREEMENT_VERSION='5.1.0'
export function validateQl7HumanReviewPair({leftReviewerId='',rightReviewerId='',left=[],right=[],tieBreakerReviewerId='',tieBreaker=[]}={}){const failures=[];
if(!leftReviewerId||!rightReviewerId||leftReviewerId===rightReviewerId)failures.push('distinct_blind_reviewers_required');
const byId=new Map(right.map(x=>[x.scenarioId,x]));
for(const l of left)if(l.oracleVerdict!==undefined||byId.get(l.scenarioId)?.oracleVerdict!==undefined)failures.push(`review_not_blind:${l.scenarioId}`);
if(tieBreaker.length&&(!tieBreakerReviewerId||[leftReviewerId,rightReviewerId].includes(tieBreakerReviewerId)))failures.push('independent_tie_breaker_required');
return Object.freeze({ok:!failures.length,failures:Object.freeze(failures)})}
