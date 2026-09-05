import {ql7StableHash, ql7Str} from '../internal/text.js'
export const QL7_SUPPORT_PUBLIC_FIGURE_QUESTION_CLASSIFIER_VERSION='5.2.4'

const RULES=Object.freeze([
  ['current_role',/(?:current|currently|now|today|latest|сейчас|нынешн|текущ|зараз|поточн|ahora|actual|güncel|şimdi|حالي|الآن|当前|现在|כיום|עכשיו).{0,30}(?:role|position|office|job|work|club|team|company|должност|роль|работ|клуб|команд|посад|роль|прац|equipo|club|cargo|rol|görev|takım|kulüp|منصب|فريق|نادي|职位|球队|俱乐部|תפקיד|קבוצה|מועדון)/iu],
  ['birth_date',/(?:when.{0,15}(?:born|birth)|date of birth|birthday|когда.{0,15}родил|дата рождения|коли.{0,15}народ|дата народження|fecha de nacimiento|cuándo nació|doğum tarihi|ne zaman doğdu|تاريخ الميلاد|متى ولد|出生日期|什么时候出生|תאריך לידה|מתי נולד)/iu],
  ['death_date',/(?:when.{0,15}(?:died|death)|date of death|когда.{0,15}умер|дата смерти|коли.{0,15}помер|дата смерті|fecha de muerte|cuándo murió|ölüm tarihi|ne zaman öldü|تاريخ الوفاة|متى توفي|去世日期|什么时候去世|תאריך פטירה|מתי נפטר)/iu],
  ['known_for',/(?:known for|famous for|why.{0,12}famous|чем.{0,12}(?:извест|знаменит)|за что.{0,12}(?:извест|знаменит)|чим.{0,12}відом|за що.{0,12}відом|por qué.{0,10}famos|conocid[oa] por|neyle tanın|neden ünlü|مشهور ب|لماذا مشهور|因为什么出名|以什么闻名|במה מפורסם|למה מפורסם)/iu],
  ['fame_start',/(?:when.{0,20}(?:became|got).{0,10}famous|when.{0,15}rose to fame|с какого.{0,15}(?:времен|года).{0,20}(?:извест|знаменит)|когда.{0,15}стал.{0,10}(?:извест|знаменит)|коли.{0,15}став.{0,10}відом|cuándo se hizo famoso|ne zaman ünlü oldu|متى أصبح مشهور|什么时候成名|מתי התפרסם)/iu],
  ['notable_work',/(?:major works?|notable works?|films?|books?|songs?|albums?|projects?|главн.{0,8}(?:работ|фильм|книг|проект)|известн.{0,8}(?:работ|фильм|книг)|основн.{0,8}(?:твір|фільм|книг)|obras principales|películas|libros|şarkı|film|kitap|أعمال|أفلام|كتب|代表作|电影|书|יצירות|סרטים|ספרים)/iu],
  ['award',/(?:awards?|prizes?|titles?|medals?|награды|премии|титулы|медали|нагороди|премії|títulos|premios|ödül|unvan|جوائز|ألقاب|奖项|头衔|פרסים|תארים)/iu],
  ['career_milestone',/(?:achievement|milestone|career|достижен|карьер|досягнен|кар'єр|logros|carrera|başarı|kariyer|إنجاز|مسيرة|成就|职业生涯|הישגים|קריירה)/iu],
  ['biography',/(?:biograph|life story|расскажи.{0,15}(?:о нем|о ней|про)|биограф|жизнь|розкажи.{0,15}(?:про|нього|неї)|біограф|biografía|hayatı|biyografi|سيرة|传记|生平|ביוגרפיה)/iu],
])
export function classifyQl7SupportPublicFigureQuestionKind(text=''){
  const source=ql7Str(text).normalize('NFKC')
  for(const [kind,re] of RULES)if(re.test(source)){const body={kind,evidence:`rule:${kind}`,sourceHash:ql7StableHash(source)};return Object.freeze({...body,receiptHash:ql7StableHash(JSON.stringify(body))})}
  const body={kind:'stable_identity',evidence:'default_identity',sourceHash:ql7StableHash(source)}
  return Object.freeze({...body,receiptHash:ql7StableHash(JSON.stringify(body))})
}
