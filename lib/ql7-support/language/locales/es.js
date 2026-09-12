import {buildQl7SupportLocaleBanks, createQl7SupportLocaleProfile} from './profileFactory.js'

export default createQl7SupportLocaleProfile({
  locale: 'es', languageTag: 'es-ES', script: 'Latin', direction: 'ltr',
  tokenization: { strategy: 'unicode-word', segmenterLocale: 'es', compounds: 'space-or-hyphen', apostropheInsideWord: false },
  sentenceSegmentation: { strategy: 'unicode-sentence', terminators: ['.', '!', '?', '…', '¡', '¿'], abbreviations: ['p. ej.', 'Sr.', 'Sra.', 'aprox.'] },
  negationAndDenial: { negationMarkers: ['no', 'nunca', 'jamás', 'tampoco', 'ya no'], denialMarkers: ['no a ti', 'no hablaba de ti', 'es una cita', 'me dijeron'], scope: 'preverbal' },
  quotationAndReportedSpeech: { quotePairs: [['«', '»'], ['“', '”'], ['"', '"']], reportedMarkers: ['dijo', 'escribió', 'me llamó', 'cito'], nestedQuotes: true },
  address: { defaultFormality: 'adaptive', formalPronouns: ['usted', 'ustedes'], informalPronouns: ['tú', 'te', 'ti'], imperativeStyle: 'polite-adaptive' },
  morphology: { agreement: 'gender-number-person', pluralRule: 'intl-cardinal-es', articleSystem: 'definite-indefinite', grammaticalGender: 'masculine-feminine' },
  typography: { questionSpacing: 'none', colonSpacing: 'after', decimalSeparator: ',', thousandsSeparator: '.', productCasePreserved: true },
  codeSwitch: { allowedProducts: ['QCoin', 'VIP Plus', 'CryptoRadar', 'MetaMarket', 'AI Box', 'BattleCoin'], unexpectedScriptPolicy: 'evidence-required' },
  inputHypotheses: { transliteration: [], keyboardLayouts: ['qwerty-es'], typoDistance: 1, joinedWordRecovery: true },
  protectedSpans: { kinds: ['url', 'email', 'phone', 'product', 'wallet-id', 'telegram-id', 'receipt-id'], preserveOffsets: true },
  emotionPragmatics: { acknowledgementThreshold: 0.78, neutralQuestionIsDistress: false, intensifierMarkers: ['muy', 'de verdad', 'terriblemente', 'totalmente'] },
  safetyCollisionControls: { negativeContexts: ['quotation', 'reported-speech', 'education', 'news', 'victim-report', 'counter-speech', 'explicit-denial'], negationWindowTokens: 8 },
  formatting: { intlLocale: 'es-ES', dateStyle: 'long', timeStyle: 'short', numberSystem: 'latn', currency: 'EUR', rtlIsolation: false },
  review: { owner: 'ql7-language-quality', status: 'pending-human-review', evidenceIds: [] },
  banks: buildQl7SupportLocaleBanks({ aliases: ['ayuda', 'soporte', 'comprobar', 'mostrar', 'explicar'], morphology: ['singular', 'plural', 'presente', 'pasado', 'condicional'], negation: ['no', 'nunca', 'ya no'], quotation: ['dijo', 'escribió', 'cita'], politeness: ['por favor', 'podría', 'indique'], relations: ['porque', 'sin embargo', 'si', 'por eso', 'por ejemplo'], clarification: ['qué resultado', 'qué sección', 'qué cambió', 'esperado y observado'], explanation: ['finalidad', 'motivo', 'límite', 'ejemplo'], instruction: ['abrir', 'elegir', 'comprobar', 'comparar', 'confirmar'], incident: ['cambio observado', 'hora aproximada', 'estado esperado', 'última acción'], emotion: ['nombrar la presión', 'reconocer la pérdida', 'evitar diagnósticos'], gratitude: ['gracias', 'te lo agradezco', 'eso ayudó'], recovery: ['pregunta incompleta', 'símbolo aislado', 'fragmento dañado'], contact: ['contacto ofrecido', 'consentimiento confirmado', 'solo mensaje directo'], titles: ['estado', 'detalles', 'siguiente paso'], badges: ['verificado', 'atención', 'restringido'], cta: ['abrir sección', 'ver detalles', 'continuar'] }),
})
