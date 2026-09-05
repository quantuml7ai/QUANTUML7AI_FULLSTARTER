import {buildQl7SupportLocaleBanks, createQl7SupportLocaleProfile} from './profileFactory.js'

export default createQl7SupportLocaleProfile({
  locale: 'he', languageTag: 'he-IL', script: 'Hebrew', direction: 'rtl',
  tokenization: { strategy: 'unicode-word', segmenterLocale: 'he', compounds: 'space-or-hyphen', cliticAware: true },
  sentenceSegmentation: { strategy: 'unicode-sentence', terminators: ['.', '!', '?', '…'], abbreviations: ['לדוגמה', 'ד״ר'], bidiAware: true },
  negationAndDenial: { negationMarkers: ['לא', 'אין', 'מעולם לא', 'אל'], denialMarkers: ['לא אליך', 'לא התכוונתי אליך', 'זה ציטוט', 'אמרו לי'], scope: 'preverbal-or-copular' },
  quotationAndReportedSpeech: { quotePairs: [['״', '״'], ['“', '”'], ['"', '"']], reportedMarkers: ['אמר', 'כתב', 'קרא לי', 'מצטט'], nestedQuotes: true },
  address: { defaultFormality: 'neutral-polite', formalPronouns: ['אתם', 'אתן'], informalPronouns: ['אתה', 'את'], imperativeStyle: 'gender-neutral-when-possible' },
  morphology: { agreement: 'gender-number-person', pluralRule: 'intl-cardinal-he', constructStateAware: true, grammaticalGender: 'masculine-feminine' },
  typography: { questionSpacing: 'none', colonSpacing: 'after', decimalSeparator: '.', thousandsSeparator: ',', productCasePreserved: true, bidiIsolation: true },
  codeSwitch: { allowedProducts: ['QCoin', 'VIP Plus', 'CryptoRadar', 'MetaMarket', 'AI Box', 'BattleCoin'], unexpectedScriptPolicy: 'bidi-isolate-products' },
  inputHypotheses: { transliteration: ['latin-hebrew'], keyboardLayouts: ['hebrew', 'qwerty'], typoDistance: 1, joinedWordRecovery: true },
  protectedSpans: { kinds: ['url', 'email', 'phone', 'product', 'wallet-id', 'telegram-id', 'receipt-id'], preserveOffsets: true, bidiIsolate: true },
  emotionPragmatics: { acknowledgementThreshold: 0.82, neutralQuestionIsDistress: false, intensifierMarkers: ['מאוד', 'באמת', 'נורא', 'לגמרי'] },
  safetyCollisionControls: { negativeContexts: ['quotation', 'reported-speech', 'education', 'news', 'victim-report', 'counter-speech', 'explicit-denial'], negationWindowTokens: 10 },
  formatting: { intlLocale: 'he-IL', dateStyle: 'long', timeStyle: 'short', numberSystem: 'latn', currency: 'ILS', rtlIsolation: true },
  review: { owner: 'ql7-language-quality', status: 'pending-human-review', evidenceIds: [] },
  banks: buildQl7SupportLocaleBanks({ aliases: ['עזרה', 'תמיכה', 'בדיקה', 'הצגה', 'הסבר'], morphology: ['יחיד', 'רבים', 'זכר', 'נקבה', 'סמיכות'], negation: ['לא', 'אף פעם לא', 'כבר לא'], quotation: ['אמר', 'כתב', 'ציטוט'], politeness: ['בבקשה', 'אפשר לציין', 'נא לפרט'], relations: ['כי', 'עם זאת', 'אם', 'לכן', 'לדוגמה'], clarification: ['איזו תוצאה', 'איזה אזור', 'מה השתנה', 'צפוי מול בפועל'], explanation: ['מטרה', 'סיבה', 'גבול', 'דוגמה'], instruction: ['פתיחה', 'בחירה', 'בדיקה', 'השוואה', 'אישור'], incident: ['שינוי שנצפה', 'זמן משוער', 'מצב צפוי', 'פעולה אחרונה'], emotion: ['זיהוי הלחץ', 'הכרה באובדן', 'ללא אבחון'], gratitude: ['תודה', 'מעריך זאת', 'זה עזר'], recovery: ['שאלה לא שלמה', 'סימן בודד', 'קטע פגום'], contact: ['הוצע אמצעי קשר', 'ההסכמה אושרה', 'הודעה פרטית בלבד'], titles: ['מצב', 'פרטים', 'השלב הבא'], badges: ['מאומת', 'לתשומת לב', 'מוגבל'], cta: ['פתיחת האזור', 'הצגת פרטים', 'המשך'] }),
})
