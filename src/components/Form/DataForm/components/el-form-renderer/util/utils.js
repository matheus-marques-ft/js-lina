import _frompairs from 'lodash/fromPairs'
import _isplainobject from 'lodash/isPlainObject'

export function noop() {}

export function collect(content, key) {
  return _frompairs(
    content
      .map((item) => ({
        id: item.id,
        type: item.type,
        value: item.type === 'group' ? collect(item.items, key) : item[key]
      }))
      .filter(
        ({ type, value }) => value !== undefined || (type === 'group' && Object.keys(value).length)
      )
      .map(({ id, value }) => [id, value])
  )
}

/**
 * Recursively merge oldV & newV, with the following strategy:
 * 1. Filter out items in newV that don't exist in content
 * 2. If the item's type is not GROUP, merge it directly by overwriting oldV
 * 3. If it is, recursively perform steps 1 to 3
 */
export function mergeValue(oldV, newV, content) {
  Object.keys(newV).forEach((k) => {
    const item = content.find((item) => item.id === k)
    if (!item) return
    if (item.type !== 'group') oldV[k] = newV[k]
    else mergeValue(oldV[k], newV[k], item.items)
  })
}

/**
 * Process value according to the outputFormat in content;
 * if the value processed by outputFormat is an object type, it will be merged (Object.assign) into value
 */
export function transformOutputValue(value, content) {
  const newVal = {}
  Object.keys(value).forEach((id) => {
    const item = content.find((item) => item.id === id)
    if (item.type !== 'group') {
      if (item.outputFormat) {
        const v = item.outputFormat(value[id])
        // REVIEW: deciding the assignment form based solely on the post-format type is a bit obscure
        if (_isplainobject(v)) Object.assign(newVal, v)
        else newVal[id] = v
      } else {
        newVal[id] = value[id]
      }
    } else {
      newVal[id] = transformOutputValue(value[id], item.items)
    }
  })
  return newVal
}

/**
 * Process value according to the inputFormat in content
 * inputFormat receives the value at the current level
 * The tricky part is that, regardless of whether the passed-in value contains a given form-item's key,
 * every item that uses inputFormat may be updated during this update
 */
export function transformInputValue(value, content) {
  const newVal = {}
  content.forEach((item) => {
    const { id } = item
    if (item.inputFormat) {
      const v = item.inputFormat(value)
      if (v !== undefined) newVal[id] = v
    } else if (id in value) {
      if (item.type !== 'group') {
        newVal[id] = value[id]
      } else {
        newVal[id] = transformInputValue(value[id], item.items)
      }
    }
  })
  return newVal
}

export function correctValue(value, content) {
  content.forEach(({ type, id, items }) => {
    switch (type) {
      case 'group':
        if (!(id in value)) value[id] = {}
        correctValue(value[id], items)
        break
      case 'checkbox-group':
        if (!(id in value)) value[id] = []
        break
    }
  })
}
