export default {
  en: {
    short: {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    },
    medium: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
      hour12: false
    },
    long: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }
  },
  // Keyed by the actual runtime locale codes (Django's hyphenated Language.choices values),
  // matching the same fix in src/i18n/langs/index.js - vue-i18n's active locale is the raw
  // 'zh-hans'/'zh-hant' cookie value, so an unhyphenated 'zh' key here was never reachable.
  'zh-hans': {
    short: {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    },
    medium: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
      hour12: false
    },
    long: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }
  },
  'zh-hant': {
    short: {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    },
    medium: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
      hour12: false
    },
    long: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }
  },
  ja: {
    short: {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    },
    medium: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
      hour12: false
    },
    long: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }
  }
}
