import {describe,it,expect} from 'vitest'
import {QL7_SUPPORT_ALL_LOCALES} from '../../../lib/ql7-support/config/behaviorManifest.js'
import {localizeQl7SupportStructuredNative} from '../../../lib/ql7-support/language/nativeStructuredLocalization.js'
describe('native32 structured localization canonical',()=>{
 it('owns exactly 32 native locales',()=>expect(QL7_SUPPORT_ALL_LOCALES).toHaveLength(32))
 it('translates visible fields while preserving ids through native engine contract',async()=>{const translate=async({text,targetLang})=>({text:`${targetLang}:${text}`,engine:'ql7-native-test',translationSucceeded:true});const x=await localizeQl7SupportStructuredNative({value:{id:'case-1',locale:'en',title:'Title',sections:[{title:'Data',items:[{id:'x',label:'Status',value:'Active'}]}]},targetLanguage:'de',sourceLanguage:'en',translate});expect(x.value.id).toBe('case-1');expect(x.value.title).toBe('de:Title');expect(x.translatedStrings).toBeGreaterThanOrEqual(4);expect(x.nativeOnly).toBe(true)})
 it('rejects unsupported target instead of falling back to an external provider',async()=>{await expect(localizeQl7SupportStructuredNative({value:{title:'Title'},targetLanguage:'uz',sourceLanguage:'en'})).rejects.toMatchObject({code:'support_native_translation_target_locale_unsupported'})})
})
