import { detectQl7SupportLanguage } from '../languageOrchestrator.js'
import { QL7_SUPPORT_SIMULATION_LANGUAGES_V11 } from '../simulationOntologyV11.js'

export const QL7_SUPPORT_LANGUAGE_DIALECT_ROUTER_VERSION_V12 = '12.0.0'

function str(value) { return String(value ?? '').trim() }
function pushSignal(signals, signal) {
  if (signal && !signals.includes(signal)) signals.push(signal)
}

export function routeQl7SupportLanguageDialectV12({ text = '', selectedLocale = '', scenarioClass = '', dialectPack = '' } = {}) {
  const detectedLanguage = detectQl7SupportLanguage(text, selectedLocale)
  const locale = QL7_SUPPORT_SIMULATION_LANGUAGES_V11.includes(detectedLanguage) ? detectedLanguage : (QL7_SUPPORT_SIMULATION_LANGUAGES_V11.includes(str(selectedLocale)) ? str(selectedLocale) : 'en')
  const source = str(text)
  const signals = []
  if (/[^\p{Script=Latin}\p{Script=Cyrillic}\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Han}\s\d\p{P}\p{S}]/u.test(source)) pushSignal(signals, 'mixed_script')
  if (/[\u{1F300}-\u{1FAFF}]/u.test(source)) pushSignal(signals, 'emoji')
  if (/\b(?:lol|bro|pls|wtf|afaik|idk|porfa|плз|плиз|саппорт|глянь|пліз)\b|ч[еёо]т\s+не/iu.test(source)) pushSignal(signals, 'slang')
  if (/[A-Za-z][\p{Script=Cyrillic}\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Han}]|[\p{Script=Cyrillic}\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Han}][A-Za-z]/u.test(source)) pushSignal(signals, 'code_switch')
  if (/\b(?:worried|angry|confused|molesto|preocupado|endişeli|sinirliyim)\b|нервнич|запут|хвилю|злюся|зол|قلق|غاضب|مرتبك|担心|生气|搞混|מודאג|כועס|מבולבל/iu.test(source)) pushSignal(signals, 'emotion_overlay')
  if (/\b(?:please|could you|por favor|lütfen)\b|пожалуйста|будь ласка|يرجى|麻烦|請|נא/iu.test(source)) pushSignal(signals, 'polite')
  if (/\b(?:urgent|asap|now|срочно|негайно|acil|rápido)\b|حالاً|فوراً|马上|דחוף/iu.test(source)) pushSignal(signals, 'urgent')
  if (/\?\?\?|!!!|q\s*cion|реклм|[A-Za-zА-Яа-я]{16,}/u.test(source.replace(/\s+/gu, ''))) pushSignal(signals, 'typo_noise')
  if (/\b(?:screenshot|screen shot|cannot provide a screenshot)\b|скрин|скриншот|без\s+скрин|не\s+могу\s+прислать\s+экран/iu.test(source)) pushSignal(signals, 'evidence_without_screenshot')
  if (/\b(?:raw\s*id|internal\s*id|database\s*id)\b|без\s+запроса\s+raw\s*id|не\s+спрашивай\s+id/iu.test(source)) pushSignal(signals, 'no_raw_id_boundary')
  if (/\b(?:operator|handoff|human support)\b|оператор|передай|передано|מפעיל|مشغل|客服/iu.test(source)) pushSignal(signals, 'operator_handoff')
  if (/\b(?:keyboard|screen-reader|screen reader|accessibility)\b|клавиатур|доступн|скринридер|قارئ\s+الشاشة|无障碍|נגישות/iu.test(source)) pushSignal(signals, 'accessibility_context')
  if (/\b(?:not the previous topic|previous subject|negation)\b|не\s+(?:прошл|предыдущ)|нет,\s*я\s+про|ні,\s*я\s+про/iu.test(source)) pushSignal(signals, 'negation_repair')
  if (/\b(?:this thing from before|the one about|same topic)\b|то\s+самое|это\s+из\s+прошлого|הדבר\s+הזה/iu.test(source)) pushSignal(signals, 'confusing_reference')
  if (/\b(?:secret dump|private key|token dump)\b|сид\s+фраз|секрет|приватн(?:ый|ий)?\s+ключ/iu.test(source)) pushSignal(signals, 'safety_boundary')
  return Object.freeze({
    version: QL7_SUPPORT_LANGUAGE_DIALECT_ROUTER_VERSION_V12,
    locale,
    selectedLocale: str(selectedLocale) || locale,
    detectedLanguage,
    dialectPack: str(dialectPack) || (signals[0] || 'standard'),
    scenarioClass: str(scenarioClass) || 'direct',
    signals: Object.freeze(signals),
    supported: QL7_SUPPORT_SIMULATION_LANGUAGES_V11.includes(locale),
  })
}
