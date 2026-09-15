import {buildQl7SupportLocaleBanks, createQl7SupportLocaleProfile} from './profileFactory.js'
export default createQl7SupportLocaleProfile({
  locale: 'de', languageTag: 'de-DE', script: 'Latin', direction: 'ltr',
  tokenization: { strategy: 'unicode-word', segmenterLocale: 'de', compounds: 'compound-aware', apostropheInsideWord: true },
  sentenceSegmentation: { strategy: 'unicode-sentence', terminators: ['.', '!', '?', '…'], abbreviations: ['z. B.', 'd. h.', 'Dr.', 'ca.'] },
  negationAndDenial: { negationMarkers: ['nicht', 'kein', 'nie', 'niemals', 'nein'], denialMarkers: ['nicht gegen dich', 'ich meinte Sie nicht', 'das ist ein Zitat', 'mir wurde gesagt'], scope: 'constituent-sensitive' },
  quotationAndReportedSpeech: { quotePairs: [['„', '“'], ['»', '«'], ['"', '"']], reportedMarkers: ['sagte', 'schrieb', 'nannte mich', 'Zitat'], nestedQuotes: true },
  address: { defaultFormality: 'formal', formalPronouns: ['Sie', 'Ihnen'], informalPronouns: ['du', 'dir'], imperativeStyle: 'polite-infinitive' },
  morphology: { agreement: 'gender-number-case', pluralRule: 'intl-cardinal-de', caseSystem: ['nominative', 'accusative', 'dative', 'genitive'], grammaticalGender: 'masculine-feminine-neuter' },
  typography: { questionSpacing: 'none', colonSpacing: 'after', decimalSeparator: ',', thousandsSeparator: '.', productCasePreserved: true },
  codeSwitch: { allowedProducts: ['QCoin', 'VIP Plus', 'CryptoRadar', 'MetaMarket', 'AI Box', 'BattleCoin'], unexpectedScriptPolicy: 'evidence-required' },
  inputHypotheses: { transliteration: ['ascii-umlaut'], keyboardLayouts: ['qwertz', 'qwerty'], typoDistance: 1, joinedWordRecovery: true },
  protectedSpans: { kinds: ['url', 'email', 'phone', 'product', 'wallet-id', 'telegram-id', 'receipt-id'], preserveOffsets: true },
  emotionPragmatics: { acknowledgementThreshold: 0.8, neutralQuestionIsDistress: false, intensifierMarkers: ['sehr', 'wirklich', 'furchtbar', 'völlig'] },
  safetyCollisionControls: { negativeContexts: ['quotation', 'reported-speech', 'education', 'news', 'victim-report', 'counter-speech', 'explicit-denial'], negationWindowTokens: 10 },
  formatting: { intlLocale: 'de-DE', dateStyle: 'long', timeStyle: 'short', numberSystem: 'latn', currency: 'EUR', rtlIsolation: false }, review: { owner: 'ql7-language-quality', status: 'pending-human-review', evidenceIds: [] },
  banks: buildQl7SupportLocaleBanks({ aliases: ['Hilfe', 'Support', 'prüfen', 'zeigen', 'erklären'], morphology: ['Singular', 'Plural', 'Kasus', 'Tempus', 'Konjunktiv'], negation: ['nicht', 'nie', 'nicht mehr'], quotation: ['sagte', 'schrieb', 'Zitat'], politeness: ['bitte', 'könnten Sie', 'geben Sie an'], relations: ['weil', 'jedoch', 'wenn', 'deshalb', 'zum Beispiel'], clarification: ['welches Ergebnis', 'welcher Bereich', 'was änderte sich', 'erwartet und beobachtet'], explanation: ['Zweck', 'Grund', 'Grenze', 'Beispiel'], instruction: ['öffnen', 'wählen', 'prüfen', 'vergleichen', 'bestätigen'], incident: ['beobachtete Änderung', 'ungefähre Zeit', 'erwarteter Zustand', 'letzte Aktion'], emotion: ['Belastung benennen', 'Verlust anerkennen', 'keine Diagnose'], gratitude: ['danke', 'ich weiß es zu schätzen', 'das half'], recovery: ['unvollständige Frage', 'einzelnes Zeichen', 'beschädigtes Fragment'], contact: ['Kontakt angeboten', 'Einwilligung bestätigt', 'nur Direktnachricht'], titles: ['Status', 'Details', 'nächster Schritt'], badges: ['bestätigt', 'Achtung', 'eingeschränkt'], cta: ['Bereich öffnen', 'Details ansehen', 'fortfahren'] }),
})
