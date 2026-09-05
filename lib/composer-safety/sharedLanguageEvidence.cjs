const VERSION='ql7.shared-language-evidence.1'
const TRANSFORMS=Object.freeze(['typo','leet','unicode_confusable','zero_width','translit','wrong_layout','split_join','code_switch','dialect','slang','euphemism','profanity','insult','threat'])
function normalize(text=''){return String(text||'').normalize('NFKC').replace(/[\u200B-\u200D\u2060\uFEFF]/gu,'').replace(/\s+/gu,' ').trim()}
function buildSharedLanguageEvidence(text,{locale='und'}={}){const normalized=normalize(text);return Object.freeze({schema:'ql7.shared-language-evidence',schemaVersion:1,version:VERSION,locale:String(locale||'und'),normalized,transformFamilies:TRANSFORMS,semanticAuthority:false})}
module.exports={VERSION,TRANSFORMS,normalize,buildSharedLanguageEvidence}
