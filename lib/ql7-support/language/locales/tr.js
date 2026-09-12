import {buildQl7SupportLocaleBanks, createQl7SupportLocaleProfile} from './profileFactory.js'

export default createQl7SupportLocaleProfile({
  locale: 'tr', languageTag: 'tr-TR', script: 'Latin', direction: 'ltr',
  tokenization: { strategy: 'unicode-word', segmenterLocale: 'tr', compounds: 'space-or-hyphen', apostropheInsideWord: true },
  sentenceSegmentation: { strategy: 'unicode-sentence', terminators: ['.', '!', '?', '…'], abbreviations: ['örn.', 'Dr.', 'sn.', 'yakl.'] },
  negationAndDenial: { negationMarkers: ['değil', 'hayır', 'hiç', 'asla', '-ma', '-me'], denialMarkers: ['sana değil', 'sizi kastetmedim', 'alıntı', 'bana dedi'], scope: 'suffix-or-copula' },
  quotationAndReportedSpeech: { quotePairs: [['“', '”'], ['«', '»'], ['"', '"']], reportedMarkers: ['dedi', 'yazdı', 'bana dedi', 'alıntı'], nestedQuotes: true },
  address: { defaultFormality: 'formal', formalPronouns: ['siz', 'sizi', 'size'], informalPronouns: ['sen', 'seni', 'sana'], imperativeStyle: 'polite-plural' },
  morphology: { agreement: 'person-number-vowel-harmony', pluralRule: 'intl-cardinal-tr', caseSystem: ['nominative', 'accusative', 'dative', 'locative', 'ablative', 'genitive'], grammaticalGender: 'none' },
  typography: { questionSpacing: 'none', colonSpacing: 'after', decimalSeparator: ',', thousandsSeparator: '.', productCasePreserved: true },
  codeSwitch: { allowedProducts: ['QCoin', 'VIP Plus', 'CryptoRadar', 'MetaMarket', 'AI Box', 'BattleCoin'], unexpectedScriptPolicy: 'evidence-required' },
  inputHypotheses: { transliteration: ['ascii-turkish'], keyboardLayouts: ['qwerty-tr', 'qwerty'], typoDistance: 1, joinedWordRecovery: true },
  protectedSpans: { kinds: ['url', 'email', 'phone', 'product', 'wallet-id', 'telegram-id', 'receipt-id'], preserveOffsets: true },
  emotionPragmatics: { acknowledgementThreshold: 0.8, neutralQuestionIsDistress: false, intensifierMarkers: ['çok', 'gerçekten', 'korkunç', 'tamamen'] },
  safetyCollisionControls: { negativeContexts: ['quotation', 'reported-speech', 'education', 'news', 'victim-report', 'counter-speech', 'explicit-denial'], negationWindowTokens: 9 },
  formatting: { intlLocale: 'tr-TR', dateStyle: 'long', timeStyle: 'short', numberSystem: 'latn', currency: 'TRY', rtlIsolation: false },
  review: { owner: 'ql7-language-quality', status: 'pending-human-review', evidenceIds: [] },
  banks: buildQl7SupportLocaleBanks({ aliases: ['yardım', 'destek', 'kontrol', 'göster', 'açıkla'], morphology: ['tekil', 'çoğul', 'zaman', 'durum eki', 'koşul'], negation: ['değil', 'asla', 'artık değil'], quotation: ['dedi', 'yazdı', 'alıntı'], politeness: ['lütfen', 'belirtin', 'açıklar mısınız'], relations: ['çünkü', 'ancak', 'eğer', 'bu nedenle', 'örneğin'], clarification: ['hangi sonuç', 'hangi bölüm', 'ne değişti', 'beklenen ve görülen'], explanation: ['amaç', 'neden', 'sınır', 'örnek'], instruction: ['aç', 'seç', 'kontrol et', 'karşılaştır', 'doğrula'], incident: ['görülen değişiklik', 'yaklaşık zaman', 'beklenen durum', 'son işlem'], emotion: ['baskıyı adlandır', 'kaybı kabul et', 'tanı koyma'], gratitude: ['teşekkürler', 'minnettarım', 'bu yardımcı oldu'], recovery: ['eksik soru', 'tek sembol', 'bozuk parça'], contact: ['iletişim sunuldu', 'onay doğrulandı', 'yalnızca özel mesaj'], titles: ['durum', 'ayrıntılar', 'sonraki adım'], badges: ['doğrulandı', 'dikkat', 'kısıtlı'], cta: ['bölümü aç', 'ayrıntıları gör', 'devam et'] }),
})
