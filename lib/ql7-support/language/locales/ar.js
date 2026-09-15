import {buildQl7SupportLocaleBanks, createQl7SupportLocaleProfile} from './profileFactory.js'

export default createQl7SupportLocaleProfile({
  locale: 'ar', languageTag: 'ar', script: 'Arabic', direction: 'rtl',
  tokenization: { strategy: 'unicode-word', segmenterLocale: 'ar', compounds: 'space', cliticAware: true },
  sentenceSegmentation: { strategy: 'unicode-sentence', terminators: ['.', '!', '؟', '…'], abbreviations: ['د.', 'مثلاً'], bidiAware: true },
  negationAndDenial: { negationMarkers: ['لا', 'ليس', 'لم', 'لن', 'ما'], denialMarkers: ['ليس لك', 'لم أقصدك', 'هذا اقتباس', 'قال لي'], scope: 'particle-and-verb' },
  quotationAndReportedSpeech: { quotePairs: [['«', '»'], ['“', '”'], ['"', '"']], reportedMarkers: ['قال', 'كتب', 'وصفني', 'أقتبس'], nestedQuotes: true },
  address: { defaultFormality: 'polite', formalPronouns: ['حضرتك', 'أنتم'], informalPronouns: ['أنت'], imperativeStyle: 'polite' },
  morphology: { agreement: 'gender-number-person', pluralRule: 'intl-cardinal-ar', numberClasses: ['zero', 'one', 'two', 'few', 'many', 'other'], grammaticalGender: 'masculine-feminine' },
  typography: { questionSpacing: 'none', colonSpacing: 'after', decimalSeparator: '٫', thousandsSeparator: '٬', productCasePreserved: true, bidiIsolation: true },
  codeSwitch: { allowedProducts: ['QCoin', 'VIP Plus', 'CryptoRadar', 'MetaMarket', 'AI Box', 'BattleCoin'], unexpectedScriptPolicy: 'bidi-isolate-products' },
  inputHypotheses: { transliteration: ['arabizi'], keyboardLayouts: ['arabic-101', 'qwerty'], typoDistance: 1, joinedWordRecovery: true },
  protectedSpans: { kinds: ['url', 'email', 'phone', 'product', 'wallet-id', 'telegram-id', 'receipt-id'], preserveOffsets: true, bidiIsolate: true },
  emotionPragmatics: { acknowledgementThreshold: 0.82, neutralQuestionIsDistress: false, intensifierMarkers: ['جداً', 'حقاً', 'تماماً', 'بشدة'] },
  safetyCollisionControls: { negativeContexts: ['quotation', 'reported-speech', 'education', 'news', 'victim-report', 'counter-speech', 'explicit-denial'], negationWindowTokens: 10 },
  formatting: { intlLocale: 'ar', dateStyle: 'long', timeStyle: 'short', numberSystem: 'arab', currency: 'USD', rtlIsolation: true },
  review: { owner: 'ql7-language-quality', status: 'pending-human-review', evidenceIds: [] },
  banks: buildQl7SupportLocaleBanks({ aliases: ['مساعدة', 'دعم', 'تحقق', 'اعرض', 'اشرح'], morphology: ['مفرد', 'مثنى', 'جمع', 'مذكر', 'مؤنث'], negation: ['لا', 'لن', 'لم يعد'], quotation: ['قال', 'كتب', 'اقتباس'], politeness: ['من فضلك', 'يرجى', 'هل يمكنك'], relations: ['لأن', 'لكن', 'إذا', 'لذلك', 'مثلاً'], clarification: ['ما النتيجة', 'أي قسم', 'ما الذي تغير', 'المتوقع والمشاهد'], explanation: ['الغرض', 'السبب', 'الحد', 'المثال'], instruction: ['افتح', 'اختر', 'تحقق', 'قارن', 'أكد'], incident: ['التغير الملحوظ', 'الوقت التقريبي', 'الحالة المتوقعة', 'آخر إجراء'], emotion: ['تسمية الضغط', 'الإقرار بالخسارة', 'تجنب التشخيص'], gratitude: ['شكراً', 'أقدّر ذلك', 'لقد ساعد'], recovery: ['سؤال غير مكتمل', 'رمز منفرد', 'جزء تالف'], contact: ['تم عرض وسيلة اتصال', 'تم تأكيد الموافقة', 'رسالة خاصة فقط'], titles: ['الحالة', 'التفاصيل', 'الخطوة التالية'], badges: ['موثق', 'تنبيه', 'مقيد'], cta: ['فتح القسم', 'عرض التفاصيل', 'متابعة'] }),
})
