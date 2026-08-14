import { localizeQl7SupportReply } from '../languageOrchestrator.js'
import { localizeQl7SupportStructuredV8 } from '../providerLocalizationV8.js'

export const QL7_SUPPORT_STRUCTURED_LOCALIZATION_VERSION_V12 = '12.0.0'

function str(value) { return String(value ?? '').trim() }

export async function localizeQl7SupportOutputV12({ text = '', card = null, targetLanguage = 'en', sourceLanguage = 'en', translate = null, maxStrings = 96, forceProvider = false } = {}) {
  const localizedText = await localizeQl7SupportReply({ text, targetLanguage, translate })
  const localizedCard = card && typeof card === 'object'
    ? await localizeQl7SupportStructuredV8({ value: card, targetLanguage, sourceLanguage, translate, maxStrings, forceProvider })
    : { value: card, status: 'no_card', translatedStrings: 0 }
  const status = [localizedText.translationStatus, localizedCard.status].filter(Boolean).join('+')
  return Object.freeze({
    version: QL7_SUPPORT_STRUCTURED_LOCALIZATION_VERSION_V12,
    text: localizedText.text,
    card: localizedCard.value,
    targetLanguage: str(targetLanguage) || 'en',
    textStatus: localizedText.translationStatus,
    cardStatus: localizedCard.status,
    translatedStrings: localizedCard.translatedStrings || 0,
    status,
  })
}
