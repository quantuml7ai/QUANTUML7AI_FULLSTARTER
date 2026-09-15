import {buildQl7SupportLocaleBanks, createQl7SupportLocaleProfile} from './profileFactory.js'

export default createQl7SupportLocaleProfile({
  locale: 'en', languageTag: 'en-US', script: 'Latin', direction: 'ltr',
  tokenization: { strategy: 'unicode-word', segmenterLocale: 'en', compounds: 'space-or-hyphen', apostropheInsideWord: true },
  sentenceSegmentation: { strategy: 'unicode-sentence', terminators: ['.', '!', '?', '…'], abbreviations: ['e.g.', 'i.e.', 'Mr.', 'Dr.'] },
  negationAndDenial: { negationMarkers: ['not', "isn't", "don't", 'never', 'no'], denialMarkers: ['not you', "I didn't mean you", 'quoted', 'someone said'], scope: 'auxiliary-to-predicate' },
  quotationAndReportedSpeech: { quotePairs: [['“', '”'], ['"', '"'], ["'", "'"]], reportedMarkers: ['said', 'wrote', 'called me', 'quote'], nestedQuotes: true },
  address: { defaultFormality: 'neutral-polite', formalPronouns: ['you'], informalPronouns: ['you'], imperativeStyle: 'polite-direct' },
  morphology: { agreement: 'number-person', pluralRule: 'intl-cardinal-en', articleSystem: 'definite-indefinite', grammaticalGender: 'limited' },
  typography: { questionSpacing: 'none', colonSpacing: 'after', decimalSeparator: '.', thousandsSeparator: ',', productCasePreserved: true },
  codeSwitch: { allowedProducts: ['QCoin', 'VIP Plus', 'CryptoRadar', 'MetaMarket', 'AI Box', 'BattleCoin'], unexpectedScriptPolicy: 'evidence-required' },
  inputHypotheses: { transliteration: [], keyboardLayouts: ['qwerty'], typoDistance: 1, joinedWordRecovery: true },
  protectedSpans: { kinds: ['url', 'email', 'phone', 'product', 'wallet-id', 'telegram-id', 'receipt-id'], preserveOffsets: true },
  emotionPragmatics: { acknowledgementThreshold: 0.78, neutralQuestionIsDistress: false, intensifierMarkers: ['really', 'so', 'terribly'] },
  safetyCollisionControls: { negativeContexts: ['quotation', 'reported-speech', 'education', 'news', 'victim-report', 'counter-speech', 'explicit-denial'], negationWindowTokens: 8 },
  formatting: { intlLocale: 'en-US', dateStyle: 'long', timeStyle: 'short', numberSystem: 'latn', currency: 'USD', rtlIsolation: false },
  review: { owner: 'ql7-language-quality', status: 'pending-human-review', evidenceIds: [] },
  banks: buildQl7SupportLocaleBanks({ aliases: ['help', 'support', 'check', 'show', 'explain'], morphology: ['singular', 'plural', 'present', 'past', 'conditional'], negation: ['not', 'never', 'no longer'], quotation: ['said', 'wrote', 'quote'], politeness: ['please', 'could you', 'would you'], relations: ['because', 'however', 'if', 'therefore', 'for example'], clarification: ['which result', 'which section', 'what changed', 'expected versus observed'], explanation: ['purpose', 'reason', 'boundary', 'example'], instruction: ['open', 'choose', 'check', 'compare', 'confirm'], incident: ['observed change', 'approximate time', 'expected state', 'latest action'], emotion: ['name the pressure', 'acknowledge loss', 'avoid diagnosis'], gratitude: ['thank you', 'appreciate it', 'that helped'], recovery: ['incomplete question', 'isolated symbol', 'damaged fragment'], contact: ['contact offered', 'consent confirmed', 'DM only'], titles: ['status', 'details', 'next step'], badges: ['verified', 'attention', 'restricted'], cta: ['open section', 'review details', 'continue'] }),
})
