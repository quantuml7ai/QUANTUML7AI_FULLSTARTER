import {resolveQl7PublicFigureIdentity} from './public-figures/publicFigureResolver.js'
import {resolveQl7PublicFigureFact} from './public-figures/publicFigureFactResolver.js'
import {ql7StableHash, ql7Str} from '../internal/text.js'
import {QL7_SUPPORT_PUBLIC_FIGURE_CATALOG, QL7_SUPPORT_PUBLIC_FIGURE_CATALOG_COUNT, QL7_SUPPORT_PUBLIC_FIGURE_CATALOG_MINIMUM} from './publicFigureCatalog.js'

export const QL7_SUPPORT_PUBLIC_FIGURE_REGISTRY_VERSION = '5.2.4'
export const QL7_SUPPORT_PUBLIC_FIGURE_MAX_CURATED = 2500
export const QL7_SUPPORT_PUBLIC_FIGURE_SELECTION_POLICY = Object.freeze({
  maxEntries: QL7_SUPPORT_PUBLIC_FIGURE_MAX_CURATED,
  minimumReleaseCoverage: QL7_SUPPORT_PUBLIC_FIGURE_CATALOG_MINIMUM,
  criteria: Object.freeze(['global_notability','historical_significance','sports_or_culture_prominence','scientific_or_technical_significance','high_ambiguity_query_value']),
  currentOfficeRequiresFreshSource: true,
  politicalEvaluationAsFactForbidden: true,
  hiddenTopListForbidden: true,
})

function person(personId, canonicalName, aliases, categories, { ambiguityGroup = '', currentSensitive = false, sourceLookupKey = '', stableFactIds = [], currentSensitiveFactIds = [], catalogRank = 0 } = {}) {
  const body = { schema:'ql7.support.public-figure', schemaVersion:QL7_SUPPORT_PUBLIC_FIGURE_REGISTRY_VERSION, personId, canonicalName,
    aliases:Object.freeze([...new Set(aliases.map(v=>ql7Str(v).toLowerCase()).filter(Boolean))]), categories:Object.freeze([...new Set(categories.map(ql7Str).filter(Boolean))]), ambiguityGroup,
    currentSensitive, currentRoleRequiresFreshSource: currentSensitive, sourceLookupKey: ql7Str(sourceLookupKey)||canonicalName,
    stableFactIds:Object.freeze([...new Set(['canonical_name','broad_category',...stableFactIds].map(ql7Str).filter(Boolean))]),
    currentSensitiveFactIds:Object.freeze([...new Set(currentSensitiveFactIds.map(ql7Str).filter(Boolean))]), catalogRank:Number(catalogRank)||0,
    publicOnly:true, privateDataForbidden:true, detailedPublicFactsRequireSource:true, readyToSend:false, finalText:false }
  return Object.freeze({ ...body, entryHash: ql7StableHash(JSON.stringify(body)) })
}

// Identity/alias registry only: no biographies or current-office claims are stored as final prose.
const CORE_ALIAS_SEEDS = Object.freeze([
  person('aristotle','Aristotle',['aristotle','аристотель','арістотель'],['history','philosophy','public_figures']),
  person('plato','Plato',['plato','платон'],['history','philosophy','public_figures']),
  person('socrates','Socrates',['socrates','сократ'],['history','philosophy','public_figures']),
  person('pablo-picasso','Pablo Picasso',['pablo picasso','пабло пикассо','пабло пікассо'],['art','history','public_figures']),
  person('martin-luther-king-jr','Martin Luther King Jr.',['martin luther king jr','martin luther king','мартин лютер кинг','мартін лютер кінг'],['history','public_figures']),
  person('leonardo-da-vinci','Leonardo da Vinci',['leonardo da vinci','леонардо да винчи','леонардо да вінчі'],['art','science','history','public_figures']),
  person('vincent-van-gogh','Vincent van Gogh',['vincent van gogh','винсент ван гог','вінсент ван гог'],['art','history','public_figures']),
  person('alan-turing','Alan Turing',['alan turing','алан тьюринг','алан тюрінг'],['science','technology','history','public_figures']),
  person('ada-lovelace','Ada Lovelace',['ada lovelace','ада лавлейс'],['science','technology','history','public_figures']),
  person('galileo-galilei','Galileo Galilei',['galileo galilei','галилео галилей','галілео галілей'],['science','history','public_figures']),
  person('charles-darwin','Charles Darwin',['charles darwin','чарльз дарвин','чарльз дарвін'],['science','history','public_figures']),
  person('isaac-newton','Isaac Newton',['isaac newton','исаак ньютон','ісаак ньютон'],['science','history','public_figures']),
  person('cristiano-ronaldo','Cristiano Ronaldo',['cristiano ronaldo','криштиану роналду','кріштіану роналду','c. ronaldo','ronaldo cr7','cr7','ronaldo','роналдо','роналду'],['football','sports'],{ambiguityGroup:'ronaldo'}),
  person('ronaldo-nazario','Ronaldo Nazário',['ronaldo nazario','ronaldo nazário','роналдо назарио','роналду назариу','r9','ronaldo','роналдо','роналду'],['football','sports'],{ambiguityGroup:'ronaldo'}),
  person('lionel-messi','Lionel Messi',['lionel messi','лионель месси','ліонель мессі','messi'],['football','sports']),
  person('muhammad-ali','Muhammad Ali',['muhammad ali','мохаммед али','мухаммед али'],['boxing','sports','history']),
  person('mike-tyson','Mike Tyson',['mike tyson','майк тайсон'],['boxing','sports']),
  person('conor-mcgregor','Conor McGregor',['conor mcgregor','конор макгрегор','конор макгрегор'],['mma','ufc','sports']),
  person('khabib-nurmagomedov','Khabib Nurmagomedov',['khabib nurmagomedov','хабиб нурмагомедов','хабіб нурмагомедов'],['mma','ufc','sports']),
  person('jon-jones','Jon Jones',['jon jones','джон джонс'],['mma','ufc','sports']),
  person('lebron-james','LeBron James',['lebron james','леброн джеймс'],['basketball','sports']),
  person('michael-jordan','Michael Jordan',['michael jordan','майкл джордан'],['basketball','sports']),
  person('novak-djokovic','Novak Djokovic',['novak djokovic','новак джокович','новак джоковіч'],['tennis','sports']),
  person('serena-williams','Serena Williams',['serena williams','серена уильямс','серена вільямс'],['tennis','sports']),
  person('lewis-hamilton','Lewis Hamilton',['lewis hamilton','льюис хэмилтон','льюїс хемілтон'],['motorsport','formula1','sports']),
  person('ayrton-senna','Ayrton Senna',['ayrton senna','айртон сенна'],['motorsport','formula1','sports','history']),
  person('albert-einstein','Albert Einstein',['albert einstein','альберт эйнштейн','альберт ейнштейн'],['science','physics','history']),
  person('marie-curie','Marie Curie',['marie curie','мария кюри','марія кюрі'],['science','chemistry','physics','history']),
  person('nikola-tesla','Nikola Tesla',['nikola tesla','никола тесла','нікола тесла'],['science','engineering','history']),
  person('stephen-hawking','Stephen Hawking',['stephen hawking','стивен хокинг','стівен хокінг'],['science','physics']),
  person('elon-musk','Elon Musk',['elon musk','илон маск','ілон маск'],['technology','business','space'],{currentSensitive:true}),
  person('walt-disney','Walt Disney',['walt disney','уолт дисней','волт дісней'],['cinema','entertainment','history']),
  person('steven-spielberg','Steven Spielberg',['steven spielberg','стивен спилберг','стівен спілберг'],['cinema','entertainment']),
  person('taylor-swift','Taylor Swift',['taylor swift','тейлор свифт','тейлор свіфт'],['music','public_figures']),
  person('beyonce','Beyoncé',['beyonce','beyoncé','бейонсе'],['music','public_figures']),
  person('william-shakespeare','William Shakespeare',['william shakespeare','уильям шекспир','вільям шекспір'],['literature','history']),
  person('leo-tolstoy','Leo Tolstoy',['leo tolstoy','лев толстой'],['literature','history']),
  person('nelson-mandela','Nelson Mandela',['nelson mandela','нельсон мандела'],['history','public_figures'],{currentSensitive:false}),
  person('mahatma-gandhi','Mahatma Gandhi',['mahatma gandhi','махатма ганди','махатма ганді'],['history','public_figures']),
  person('queen-elizabeth-ii','Elizabeth II',['queen elizabeth ii','elizabeth ii','елизавета ii','єлизавета ii'],['royalty','history']),
  person('king-charles-iii','Charles III',['king charles iii','charles iii','карл iii','чарльз iii'],['royalty','public_figures'],{currentSensitive:true}),

])

const CORE_ALIAS_BY_ID = new Map(CORE_ALIAS_SEEDS.map((row)=>[row.personId,row]))
const CATALOG_PEOPLE = QL7_SUPPORT_PUBLIC_FIGURE_CATALOG.map((row)=>{
  const seed=CORE_ALIAS_BY_ID.get(row.personId)
  return person(row.personId,row.canonicalName,[...(row.aliases||[]),...(seed?.aliases||[])],[...(row.categories||[]),...(seed?.categories||[])],{
    ambiguityGroup:seed?.ambiguityGroup||'',currentSensitive:seed?.currentSensitive===true,sourceLookupKey:row.sourceLookupKey||row.canonicalName,
    stableFactIds:row.stableFactIds||[],currentSensitiveFactIds:row.currentSensitiveFactIds||[],catalogRank:row.catalogRank||0,
  })
})
const CATALOG_IDS = new Set(CATALOG_PEOPLE.map((row)=>row.personId))
const PEOPLE = Object.freeze([...CATALOG_PEOPLE,...CORE_ALIAS_SEEDS.filter((row)=>!CATALOG_IDS.has(row.personId))])

export const QL7_SUPPORT_PUBLIC_FIGURES = PEOPLE

const ROLE_QUERY_RE = /(?:president|prime\s+minister|king|queen|monarch|президент|премьер|прем’єр|король|королева|монарх|presidente|rey|reina|cumhurbaşkanı|kral|رئيس|ملك|ملكة|总统|国王|女王|נשיא|מלך|מלכה)/iu
function norm(v=''){return ql7Str(v).toLowerCase().normalize('NFKC').replace(/[’'`]/gu,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim()}

export function resolveQl7SupportPublicFigure(query = '') {
  const source=norm(query); if(!source) return null
  const ranked=PEOPLE.map(row=>{let score=0;for(const alias of row.aliases){const a=norm(alias);if(!a)continue;if(source===a)score=Math.max(score,100+a.length);else if(source.includes(a))score=Math.max(score,40+a.length);else if(a.includes(source)&&source.length>=4)score=Math.max(score,20+source.length)}return{row,score}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score)
  if(ranked.length){const top=ranked[0],second=ranked[1];const sameAmbiguity=second&&top.row.ambiguityGroup&&top.row.ambiguityGroup===second.row.ambiguityGroup;const decisive=!second||top.score-second.score>=8;if(decisive)return Object.freeze({decision:'selected',selected:top.row,candidates:Object.freeze(ranked.filter(x=>x.score>0).map(x=>x.row)),ambiguity:false,currentSourceRequired:top.row.currentSensitive===true});if(sameAmbiguity||top.score===second.score)return Object.freeze({decision:'clarify',selected:null,candidates:Object.freeze(ranked.filter(x=>x.score===top.score||x.row.ambiguityGroup===top.row.ambiguityGroup).map(x=>x.row)),ambiguity:true,currentSourceRequired:ranked.some(x=>x.row.currentSensitive)})}
  if(ROLE_QUERY_RE.test(source)) return Object.freeze({decision:'current_role_query',selected:null,candidates:Object.freeze([]),ambiguity:false,currentSourceRequired:true,roleQuery:true})
  return null
}

export function auditQl7SupportPublicFigureRegistry() {
  const ids=new Set(), failures=[]
  for(const row of PEOPLE){if(ids.has(row.personId))failures.push(`duplicate:${row.personId}`);ids.add(row.personId);if(!row.aliases.length)failures.push(`aliases:${row.personId}`);if(row.readyToSend!==false)failures.push(`ready_text:${row.personId}`)}
  if(PEOPLE.length<QL7_SUPPORT_PUBLIC_FIGURE_CATALOG_MINIMUM)failures.push(`coverage_floor:${PEOPLE.length}/${QL7_SUPPORT_PUBLIC_FIGURE_CATALOG_MINIMUM}`);if(QL7_SUPPORT_PUBLIC_FIGURE_CATALOG_COUNT<QL7_SUPPORT_PUBLIC_FIGURE_CATALOG_MINIMUM)failures.push(`catalog_floor:${QL7_SUPPORT_PUBLIC_FIGURE_CATALOG_COUNT}/${QL7_SUPPORT_PUBLIC_FIGURE_CATALOG_MINIMUM}`);return Object.freeze({ok:failures.length===0,count:PEOPLE.length,catalogCount:QL7_SUPPORT_PUBLIC_FIGURE_CATALOG_COUNT,required:QL7_SUPPORT_PUBLIC_FIGURE_CATALOG_MINIMUM,maxCurated:QL7_SUPPORT_PUBLIC_FIGURE_MAX_CURATED,selectionPolicy:QL7_SUPPORT_PUBLIC_FIGURE_SELECTION_POLICY,publicOnly:true,privateDataForbidden:true,detailedFactsSourceBound:true,failures:Object.freeze(failures)})
}

export { resolveQl7PublicFigureIdentity, resolveQl7PublicFigureFact }
