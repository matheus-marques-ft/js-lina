import { VueCookieNext as VueCookie } from 'vue-cookie-next'
import { getStore } from '@/store/registry'
import messages from './langs'

const REGISTERED_LOCALES = Object.keys(messages)

// navigator.language reports whatever dialect the OS/browser is set to (e.g. 'es-419',
// 'en-US'), which almost never matches one of REGISTERED_LOCALES exactly. Used raw, this used
// to feed straight into both vue-i18n's `locale` and the ?lang= query for
// fetchTranslationsFromAPI() (i18n.js) - the backend catalog normalizes dialects server-side
// and would serve real content for e.g. 'es-419', while vue-i18n's local `messages` (this
// file's own map) has no 'es-419' key and silently fell back to `fallbackLocale: 'en'` for
// every string that isn't proxied through the backend - the exact mixed-language rendering
// (Spanish audit labels next to English category headers) this fixes. Matching against the
// registered set first by exact code, then by base subtag, keeps every consumer of
// getLangCode() (i18n.js, Language.vue, useDateTime.js, ...) on one consistent, actually-
// supported locale instead of each silently diverging on the same raw string.
function normalizeLangCode(rawLang) {
  if (!rawLang) return rawLang
  const lower = rawLang.toLowerCase()
  if (REGISTERED_LOCALES.includes(lower)) return lower
  const base = lower.split('-')[0]
  const match = REGISTERED_LOCALES.find((code) => code === base || code.split('-')[0] === base)
  return match || rawLang
}

export function getLangCode(withInternalCode = false) {
  const cookieLang = VueCookie.getCookie('django_language')
  let lang = normalizeLangCode(cookieLang || navigator.language.toLowerCase())
  if (withInternalCode) {
    const store = getStore()
    const languages = store?.getters?.publicSettings?.['LANGUAGES'] || []
    for (const langObj of languages) {
      if (langObj['other_codes'].indexOf(lang) > -1) {
        lang = langObj['code']
        break
      }
    }
  }
  return lang
}
