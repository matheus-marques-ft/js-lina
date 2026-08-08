/* eslint-disable no-sequences */
import _ from 'lodash'
import { markRaw, toRaw } from 'vue'
/**
 * Each item of content is shallow-copied one level deep
 * Properties may only be added/modified at the item level, e.g. item.a = b
 * Values must not be modified directly to avoid affecting the original content, e.g. item.a.b = c
 */
export default function transformContent(content) {
  return content.map(({ ...item }) => {
    if (item.type === 'group') {
      item.items = transformContent(item.items)
    } else {
      removeDollarInKey(item)
      extractRulesFromComponent(item)
      // Some old code writes it as checkboxGroup & radioGroup
      item.type = _.kebabCase(item.type)
    }

    // Use markRaw to mark the component definition, to avoid Vue turning it into a reactive object
    if (item.component && typeof item.component !== 'string') {
      item.component = markRaw(toRaw(item.component))
    }

    return item
  })
}

function removeDollarInKey(item) {
  Object.keys(item)
    .filter((k) => k.startsWith('$'))
    .filter((k) => !(k.slice(1) in item))
    .forEach((k) => ((item[k.slice(1)] = item[k]), delete item[k]))
}

export function extractRulesFromComponent(item) {
  if (item.overrideRules) return
  const { component } = item
  // Cannot currently handle globally registered components
  if (!component || typeof component === 'string') return

  const { rules = [] } = component
  item.rules = [...(item.rules || []), ...(typeof rules === 'function' ? rules(item) : rules)]
}
