import {buildQl7SupportLocaleBanks, createQl7SupportLocaleProfile} from './profileFactory.js'

export default createQl7SupportLocaleProfile({
  locale: 'zh', languageTag: 'zh-CN', script: 'Han', direction: 'ltr',
  tokenization: { strategy: 'intl-segmenter', segmenterLocale: 'zh', compounds: 'dictionary-segmentation', cjkMode: true },
  sentenceSegmentation: { strategy: 'cjk-sentence', terminators: ['。', '！', '？', '…'], abbreviations: [], cjkAware: true },
  negationAndDenial: { negationMarkers: ['不', '没', '没有', '绝不', '别'], denialMarkers: ['不是说你', '我不是指你', '这是引用', '别人对我说'], scope: 'preverbal' },
  quotationAndReportedSpeech: { quotePairs: [['“', '”'], ['「', '」'], ['『', '』']], reportedMarkers: ['说', '写道', '称呼我', '引用'], nestedQuotes: true },
  address: { defaultFormality: 'neutral-polite', formalPronouns: ['您'], informalPronouns: ['你'], imperativeStyle: '请-form' },
  morphology: { agreement: 'analytic', pluralRule: 'intl-cardinal-zh', classifierAware: true, grammaticalGender: 'none' },
  typography: { questionSpacing: 'none', colonSpacing: 'none', decimalSeparator: '.', thousandsSeparator: ',', productCasePreserved: true, fullWidthPunctuation: true },
  codeSwitch: { allowedProducts: ['QCoin', 'VIP Plus', 'CryptoRadar', 'MetaMarket', 'AI Box', 'BattleCoin'], unexpectedScriptPolicy: 'product-only-latin' },
  inputHypotheses: { transliteration: ['pinyin'], keyboardLayouts: ['pinyin-ime', 'qwerty'], typoDistance: 1, joinedWordRecovery: false },
  protectedSpans: { kinds: ['url', 'email', 'phone', 'product', 'wallet-id', 'telegram-id', 'receipt-id'], preserveOffsets: true },
  emotionPragmatics: { acknowledgementThreshold: 0.82, neutralQuestionIsDistress: false, intensifierMarkers: ['非常', '真的', '特别', '完全'] },
  safetyCollisionControls: { negativeContexts: ['quotation', 'reported-speech', 'education', 'news', 'victim-report', 'counter-speech', 'explicit-denial'], negationWindowTokens: 12 },
  formatting: { intlLocale: 'zh-CN', dateStyle: 'long', timeStyle: 'short', numberSystem: 'latn', currency: 'CNY', rtlIsolation: false },
  review: { owner: 'ql7-language-quality', status: 'pending-human-review', evidenceIds: [] },
  banks: buildQl7SupportLocaleBanks({ aliases: ['帮助', '支持', '检查', '显示', '说明'], morphology: ['单数语义', '复数语义', '时态标记', '体标记', '量词'], negation: ['不', '从不', '不再'], quotation: ['说', '写道', '引用'], politeness: ['请', '麻烦说明', '可以告知'], relations: ['因为', '不过', '如果', '因此', '例如'], clarification: ['需要什么结果', '哪个页面', '发生了什么变化', '预期与实际'], explanation: ['用途', '原因', '边界', '示例'], instruction: ['打开', '选择', '检查', '比较', '确认'], incident: ['发现的变化', '大致时间', '预期状态', '最近操作'], emotion: ['说明压力', '承认损失', '避免诊断'], gratitude: ['谢谢', '感谢', '这很有帮助'], recovery: ['问题不完整', '单独符号', '内容损坏'], contact: ['已提供联系方式', '已确认同意', '仅私信'], titles: ['状态', '详情', '下一步'], badges: ['已验证', '请注意', '已限制'], cta: ['打开页面', '查看详情', '继续'] }),
})
