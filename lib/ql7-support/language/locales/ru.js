import {buildQl7SupportLocaleBanks, createQl7SupportLocaleProfile} from './profileFactory.js'

export default createQl7SupportLocaleProfile({
  locale: 'ru', languageTag: 'ru-RU', script: 'Cyrillic', direction: 'ltr',
  tokenization: { strategy: 'unicode-word', segmenterLocale: 'ru', compounds: 'space-or-hyphen', apostropheInsideWord: false },
  sentenceSegmentation: { strategy: 'unicode-sentence', terminators: ['.', '!', '?', '…'], abbreviations: ['т. е.', 'т. к.', 'г.', 'руб.'] },
  negationAndDenial: { negationMarkers: ['не', 'нет', 'никогда', 'ни разу', 'не вам'], denialMarkers: ['не тебе', 'не вам', 'я не про вас', 'это цитата', 'мне сказали'], scope: 'particle-before-predicate' },
  quotationAndReportedSpeech: { quotePairs: [['«', '»'], ['„', '“'], ['"', '"']], reportedMarkers: ['сказал', 'написал', 'назвали меня', 'цитирую'], nestedQuotes: true },
  address: { defaultFormality: 'formal', formalPronouns: ['вы', 'вас', 'вам'], informalPronouns: ['ты', 'тебя', 'тебе'], imperativeStyle: 'polite-plural' },
  morphology: { agreement: 'gender-number-case', pluralRule: 'intl-cardinal-ru', caseSystem: ['nominative', 'genitive', 'dative', 'accusative', 'instrumental', 'prepositional'], grammaticalGender: 'masculine-feminine-neuter' },
  typography: { questionSpacing: 'none', colonSpacing: 'after', decimalSeparator: ',', thousandsSeparator: ' ', productCasePreserved: true },
  codeSwitch: { allowedProducts: ['QCoin', 'VIP Plus', 'CryptoRadar', 'MetaMarket', 'AI Box', 'BattleCoin'], unexpectedScriptPolicy: 'evidence-required' },
  inputHypotheses: { transliteration: ['latin-to-cyrillic'], keyboardLayouts: ['йцукен', 'qwerty'], typoDistance: 1, joinedWordRecovery: true },
  protectedSpans: { kinds: ['url', 'email', 'phone', 'product', 'wallet-id', 'telegram-id', 'receipt-id'], preserveOffsets: true },
  emotionPragmatics: { acknowledgementThreshold: 0.8, neutralQuestionIsDistress: false, intensifierMarkers: ['очень', 'правда', 'ужасно', 'совсем'] },
  safetyCollisionControls: { negativeContexts: ['quotation', 'reported-speech', 'education', 'news', 'victim-report', 'counter-speech', 'explicit-denial'], negationWindowTokens: 9 },
  formatting: { intlLocale: 'ru-RU', dateStyle: 'long', timeStyle: 'short', numberSystem: 'latn', currency: 'USD', rtlIsolation: false },
  review: { owner: 'ql7-language-quality', status: 'pending-human-review', evidenceIds: [] },
  banks: buildQl7SupportLocaleBanks({ aliases: ['помощь', 'поддержка', 'проверить', 'показать', 'объяснить'], morphology: ['единственное число', 'множественное число', 'вид', 'падеж', 'условное наклонение'], negation: ['не', 'никогда', 'больше не'], quotation: ['сказал', 'написал', 'цитата'], politeness: ['пожалуйста', 'подскажите', 'уточните'], relations: ['потому что', 'однако', 'если', 'поэтому', 'например'], clarification: ['какой результат', 'какой раздел', 'что изменилось', 'ожидание и наблюдение'], explanation: ['назначение', 'причина', 'граница', 'пример'], instruction: ['открыть', 'выбрать', 'проверить', 'сравнить', 'подтвердить'], incident: ['замеченное изменение', 'примерное время', 'ожидаемое состояние', 'последнее действие'], emotion: ['назвать переживание', 'признать потерю', 'не ставить диагноз'], gratitude: ['спасибо', 'благодарю', 'это помогло'], recovery: ['незаконченный вопрос', 'одиночный символ', 'повреждённый фрагмент'], contact: ['контакт предложен', 'согласие подтверждено', 'только личный чат'], titles: ['статус', 'детали', 'следующий шаг'], badges: ['подтверждено', 'внимание', 'ограничено'], cta: ['открыть раздел', 'посмотреть детали', 'продолжить'] }),
})
