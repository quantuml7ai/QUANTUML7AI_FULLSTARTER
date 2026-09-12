import {buildQl7SupportLocaleBanks, createQl7SupportLocaleProfile} from './profileFactory.js'

export default createQl7SupportLocaleProfile({
  locale: 'uk', languageTag: 'uk-UA', script: 'Cyrillic', direction: 'ltr',
  tokenization: { strategy: 'unicode-word', segmenterLocale: 'uk', compounds: 'space-or-hyphen', apostropheInsideWord: true },
  sentenceSegmentation: { strategy: 'unicode-sentence', terminators: ['.', '!', '?', '…'], abbreviations: ['тобто', 'т. зв.', 'р.', 'грн.'] },
  negationAndDenial: { negationMarkers: ['не', 'ні', 'ніколи', 'жодного разу', 'не вам'], denialMarkers: ['не тобі', 'не вам', 'я не про вас', 'це цитата', 'мені сказали'], scope: 'particle-before-predicate' },
  quotationAndReportedSpeech: { quotePairs: [['«', '»'], ['„', '“'], ['"', '"']], reportedMarkers: ['сказав', 'написав', 'назвали мене', 'цитую'], nestedQuotes: true },
  address: { defaultFormality: 'formal', formalPronouns: ['ви', 'вас', 'вам'], informalPronouns: ['ти', 'тебе', 'тобі'], imperativeStyle: 'polite-plural' },
  morphology: { agreement: 'gender-number-case', pluralRule: 'intl-cardinal-uk', caseSystem: ['nominative', 'genitive', 'dative', 'accusative', 'instrumental', 'locative', 'vocative'], grammaticalGender: 'masculine-feminine-neuter' },
  typography: { questionSpacing: 'none', colonSpacing: 'after', decimalSeparator: ',', thousandsSeparator: ' ', productCasePreserved: true },
  codeSwitch: { allowedProducts: ['QCoin', 'VIP Plus', 'CryptoRadar', 'MetaMarket', 'AI Box', 'BattleCoin'], unexpectedScriptPolicy: 'evidence-required' },
  inputHypotheses: { transliteration: ['latin-to-cyrillic'], keyboardLayouts: ['йцукен-uk', 'qwerty'], typoDistance: 1, joinedWordRecovery: true },
  protectedSpans: { kinds: ['url', 'email', 'phone', 'product', 'wallet-id', 'telegram-id', 'receipt-id'], preserveOffsets: true },
  emotionPragmatics: { acknowledgementThreshold: 0.8, neutralQuestionIsDistress: false, intensifierMarkers: ['дуже', 'справді', 'жахливо', 'зовсім'] },
  safetyCollisionControls: { negativeContexts: ['quotation', 'reported-speech', 'education', 'news', 'victim-report', 'counter-speech', 'explicit-denial'], negationWindowTokens: 9 },
  formatting: { intlLocale: 'uk-UA', dateStyle: 'long', timeStyle: 'short', numberSystem: 'latn', currency: 'UAH', rtlIsolation: false },
  review: { owner: 'ql7-language-quality', status: 'pending-human-review', evidenceIds: [] },
  banks: buildQl7SupportLocaleBanks({ aliases: ['допомога', 'підтримка', 'перевірити', 'показати', 'пояснити'], morphology: ['однина', 'множина', 'вид', 'відмінок', 'умовний спосіб'], negation: ['не', 'ніколи', 'більше не'], quotation: ['сказав', 'написав', 'цитата'], politeness: ['будь ласка', 'підкажіть', 'уточніть'], relations: ['тому що', 'однак', 'якщо', 'тому', 'наприклад'], clarification: ['який результат', 'який розділ', 'що змінилося', 'очікування і спостереження'], explanation: ['призначення', 'причина', 'межа', 'приклад'], instruction: ['відкрити', 'обрати', 'перевірити', 'порівняти', 'підтвердити'], incident: ['помічена зміна', 'приблизний час', 'очікуваний стан', 'остання дія'], emotion: ['назвати переживання', 'визнати втрату', 'не ставити діагноз'], gratitude: ['дякую', 'вдячний', 'це допомогло'], recovery: ['незавершене питання', 'один символ', 'пошкоджений фрагмент'], contact: ['контакт запропоновано', 'згоду підтверджено', 'лише особистий чат'], titles: ['статус', 'деталі', 'наступний крок'], badges: ['підтверджено', 'увага', 'обмежено'], cta: ['відкрити розділ', 'переглянути деталі', 'продовжити'] }),
})
