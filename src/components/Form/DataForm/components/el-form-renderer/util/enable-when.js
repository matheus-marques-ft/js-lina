import _get from 'lodash/get'
import _has from 'lodash/has'

/**
 * Handle enableWhen
 *
 * AND condition: a simple dependency relation has 2 cases: a plain object || a string
 * OR condition: wrap all AND conditions in [], e.g. enableWhen: [{ a: 1 }, { a: 2 }]
 */
export default function getEnableWhenStatus(enableWhen, value) {
  if (!enableWhen) return true
  // Handle a single AND condition
  const handleCondition = (condition) => {
    // Simple string (ID): true as long as it has a value
    if (typeof condition === 'string') return _has(value, condition)
    // Plain object check: whether all dependent conditions pass
    return Object.keys(condition).every((path) => {
      const v = _get(value, path)
      return v !== undefined && v === condition[path]
    })
  }

  return Array.isArray(enableWhen) ? enableWhen.some(handleCondition) : handleCondition(enableWhen)
}
