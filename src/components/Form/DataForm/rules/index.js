import i18n from '@/i18n/i18n'
import request from '@/utils/request'

export const Required = {
  required: true,
  message: i18n.t('FieldRequiredError'),
  trigger: 'blur'
}

export const RequiredChange = {
  required: true,
  message: i18n.t('FieldRequiredError'),
  trigger: 'change'
}

export const EmailCheck = {
  type: 'email',
  message: i18n.t('InputEmailAddress'),
  trigger: ['blur', 'change']
}

export const LengthCheck = {
  validator: (rule, value, callback) => {
    if (value < 30) {
      callback(new Error(`${i18n.t('MinNumber30')}`))
    } else {
      callback()
    }
  },
  type: 'number',
  trigger: ['blur', 'change']
}

export const IpCheck = {
  required: true,
  validator: (rule, value, callback) => {
    value = value?.trim()
    const urlRegExp = /^[\w://.?=&#-]+$/
    if (urlRegExp.test(value)) {
      callback()
    } else {
      callback(new Error(i18n.t('FormatError')))
    }
  },
  trigger: ['blur', 'change']
}

export const specialEmojiCheck = {
  validator: (rule, value, callback) => {
    value = value?.trim()
    if (/[\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]/.test(value)) {
      callback(new Error(i18n.t('NotSpecialEmoji')))
    } else {
      callback()
    }
  },
  trigger: ['blur', 'change']
}

// Only letters, digits, and underscores are allowed
export const matchAlphanumericUnderscore = {
  validator: (rule, value, callback) => {
    value = value?.trim()
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      callback(new Error(i18n.t('notAlphanumericUnderscore')))
    } else {
      callback()
    }
  },
  trigger: ['blur', 'change']
}

// Cannot contain ()
export const MatchExcludeParenthesis = {
  validator: (rule, value, callback) => {
    value = value?.trim()
    if (!/^[^()]*$/.test(value)) {
      callback(new Error(i18n.t('notParenthesis')))
    } else {
      callback()
    }
  },
  trigger: ['blur', 'change']
}

export const JsonRequired = {
  required: true,
  trigger: 'change',
  validator: (rule, value, callback) => {
    try {
      typeof value === 'string' ? JSON.parse(value) : value
      callback()
    } catch (e) {
      callback(new Error(i18n.t('InvalidJson')))
    }
  }
}

export const JsonRequiredUserNameMapped = {
  required: true,
  trigger: 'change',
  validator: (rule, value, callback) => {
    try {
      const v = typeof value === 'string' ? JSON.parse(value) : value
      const hasUserName = _.map(v, (value) => value)
      if (!hasUserName.includes('username')) {
        callback(new Error(i18n.t('requiredHasUserNameMapped')))
      }
      callback()
    } catch (e) {
      callback(new Error(i18n.t('InvalidJson')))
    }
  }
}

export default {
  IpCheck,
  Required,
  LengthCheck,
  RequiredChange,
  EmailCheck,
  specialEmojiCheck,
  matchAlphanumericUnderscore,
  MatchExcludeParenthesis
}

/**
 * @description Form uniqueness validation
 *
 * @param {Object} options
 * @param {string} options.url - the list query URL
 * @param {string} options.param - the query parameter name
 * @param {string} options.label - the field's display label
 * @param {string} options.fieldName - the field name
 * @param {function(): (string|number)} options.getIgnoreId - returns the current object's id in an update scenario
 */
export function UniqueCheck(options = {}) {
  const { url, param, label, fieldName, getIgnoreId } = options

  function existsInResponse(res) {
    if (Array.isArray(res)) return res.length > 0
    if (res && typeof res === 'object') {
      if (typeof res.count === 'number') return res.count > 0
      if (Array.isArray(res.results)) return res.results.length > 0
    }
    return !!res
  }

  function extractIds(res) {
    if (Array.isArray(res)) return res.map((i) => i?.id).filter(Boolean)
    if (res && Array.isArray(res.results)) return res.results.map((i) => i?.id).filter(Boolean)
    return []
  }

  return {
    async validator(rule, value, callback) {
      try {
        let v = value

        if (typeof v === 'string') v = v.trim()
        if (v === '' || v === undefined || v === null) return callback()
        if (!url || !param) return callback()

        const res = await request.get(url, { params: { [param]: v } })
        let duplicated = existsInResponse(res)

        if (duplicated && typeof getIgnoreId === 'function') {
          const curId = getIgnoreId()
          if (curId) {
            const ids = extractIds(res)

            // The query result only contains itself, so it is not considered a duplicate
            if (ids.length >= 1 && ids.every((id) => id === curId)) {
              duplicated = false
            }
          }
        }

        if (duplicated) {
          const _label = label || fieldName || ''
          const msg = `${_label}${i18n.t('Existing')}`
          callback(new Error(msg))
        } else {
          callback()
        }
      } catch (e) {
        callback()
      }
    },
    trigger: ['blur']
  }
}
