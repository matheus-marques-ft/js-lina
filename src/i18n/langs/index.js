import en from './en.json'
import es from './es.json'
import pt_br from './pt_br.json'

import elementEn from 'element-plus/es/locale/lang/en'
import elementEs from 'element-plus/es/locale/lang/es'
import elementPtBr from 'element-plus/es/locale/lang/pt-br'

// Keyed by the ACTUAL runtime locale codes (Django's Language.choices values - see
// js-jumpserver apps/common/const/choices.py), not the underscore-style names of the JSON
// files - vue-i18n's active `locale` is set from getLangCode() (src/i18n/utils.js), which
// normalizes the `django_language` cookie/browser locale against exactly this object's key
// set before returning, so it always lands on 'pt-br'/'zh-hans'/'zh-hant' (hyphenated). A
// 'pt_br'/'zh_hant' key here would never match that normalized locale, silently falling back
// to `fallbackLocale: 'en'` for every key not separately patched at runtime by
// fetchTranslationsFromAPI() (which merges under the same code it queried with - see
// i18n.js). The import names / JSON filenames stay underscore-style; only the object keys
// below need to match Django's codes - and getLangCode()'s normalization reads this object's
// keys directly, so this is the single source of truth for "which codes are registered."
const elementLocaleByAppLocale = {
  en: elementEn,
  'pt-br': elementPtBr,
  es: elementEs,
}

const appLocaleMessages = {
  en,
  es,
  'pt-br': pt_br
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
  en: elementEn,
  'pt-br': elementPtBr,
  es: elementEs,
}

export function getElementLocale(cookieLang) {
  const raw = (cookieLang || 'en').toLowerCase()
  return elementLocaleByCookieLang[raw] || elementLocaleByCookieLang[raw.split('-')[0]] || elementEn
}

export default messages
