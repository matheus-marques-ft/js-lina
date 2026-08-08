import en from './en.json'
import ja from './ja.json'
import zh from './zh.json'
import zh_hant from './zh_hant.json'
import elementEn from 'element-plus/es/locale/lang/en'
import elementEs from 'element-plus/es/locale/lang/es'
import elementJa from 'element-plus/es/locale/lang/ja'
import elementKo from 'element-plus/es/locale/lang/ko'
import elementPtBr from 'element-plus/es/locale/lang/pt-br'
import elementRu from 'element-plus/es/locale/lang/ru'
import elementVi from 'element-plus/es/locale/lang/vi'
import elementZhCn from 'element-plus/es/locale/lang/zh-cn'
import elementZhTw from 'element-plus/es/locale/lang/zh-tw'

const elementLocaleByAppLocale = {
  zh: elementZhCn,
  zh_hant: elementZhTw,
  en: elementEn,
  ja: elementJa,
  pt_br: elementPtBr,
  es: elementEs,
  ru: elementRu,
  ko: elementKo,
  vi: elementVi
}

const appLocaleMessages = {
  zh,
  zh_hant,
  en,
  ja
}

const messages = Object.keys(elementLocaleByAppLocale).reduce((acc, appLocale) => {
  const elementLocale = elementLocaleByAppLocale[appLocale] || {}
  const appMessages = appLocaleMessages[appLocale] || {}
  acc[appLocale] = { ...elementLocale, ...appMessages }
  return acc
}, {})

// Maps the language code from the backend-issued cookie (django_language) to the built-in Element Plus locale object.
// Used by main.js to set the text of built-in components (messagebox/pagination/empty state/date picker, etc.)
// according to the current language when installing the ElementPlus plugin; switching languages reloads the whole
// page, so it's fine to just read the current language statically.
const elementLocaleByCookieLang = {
  'zh-hans': elementZhCn,
  'zh-cn': elementZhCn,
  zh: elementZhCn,
  'zh-hant': elementZhTw,
  'zh-tw': elementZhTw,
  en: elementEn,
  ja: elementJa,
  'pt-br': elementPtBr,
  es: elementEs,
  ru: elementRu,
  ko: elementKo,
  vi: elementVi
}

export function getElementLocale(cookieLang) {
  const raw = (cookieLang || 'en').toLowerCase()
  return elementLocaleByCookieLang[raw] || elementLocaleByCookieLang[raw.split('-')[0]] || elementEn
}

export default messages
