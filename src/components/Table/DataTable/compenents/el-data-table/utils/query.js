export const valueSeparator = '~'
export const paramSeparator = ','
export const queryFlag = 'q='
export const queryPattern = new RegExp(queryFlag + '.*' + paramSeparator)

/**
 * Convert a query object into a string that can be appended to a url
 * qs.stringify can only customize the delimiter, not the equal sign
 * {a: 'a&b', b: true} => 'a~a%26b,b~true'
 *
 * @param {object} query
 * @param {string} equal - separator between key and value
 * @param {string} delimiter - separator between key-value pairs
 * @return {string}
 */
export function stringify(query, equal = valueSeparator, delimiter = paramSeparator) {
  return Object.keys(query)
    .flatMap((k) => {
      const value = query[k]
      const shouldRepeat =
        equal === '=' &&
        delimiter === '&' &&
        /__(?:exact|icontains|startswith|in|icontains_any|icontains_all)$/.test(k) &&
        Array.isArray(value)
      const values = shouldRepeat ? value : [value]
      return values.map(
        (item) => `${k}${equal}${encodeURIComponent(item)}`
      )
    })
    .join(delimiter)
}

/**
 * Convert a string appended to a url back into a query object
 * qs.parse can only customize the delimiter, not the equal sign
 * 'a~a%26b,b~true' => {a: 'a&b', b: true}
 *
 * @param {string} query
 * @param {string} equal - separator between key and value
 * @param {string} delimiter - separator between key-value pairs
 * @return {object}
 */
export function parse(query, equal = valueSeparator, delimiter = paramSeparator) {
  return query
    .split(delimiter)
    .map((param) => param.split(equal))
    .reduce((obj, [k, v]) => {
      obj[k] = decodeURIComponent(v)
      return obj
    }, {})
}

/**
 * Convert a query object into a string and insert it into the url
 *
 * @param {string} url
 * @param {object} query
 * @param {'history'|'hash'} routerMode
 * @returns {string} the url with the query inserted
 */
export function set(url, query, routerMode) {
  const queryStr = queryFlag + stringify(query) + paramSeparator
  const queryPrefix = (str) => (str.indexOf('?') > -1 ? '&' : '?')

  if (queryPattern.test(url)) {
    return url.replace(queryPattern, queryStr)
  } else if (url.indexOf('#') === -1) {
    return url + queryPrefix(url) + queryStr
  } else {
    const [path, hash] = url.split('#')
    if (routerMode === 'history') {
      return path + queryPrefix(path) + queryStr + '#' + hash
    } else {
      return url + queryPrefix(hash) + queryStr
    }
  }
}

/**
 * Extract the query object from the url; return null if there is none
 *
 * @param {string} url
 * @return {object|null} the query parameters as an object
 */
export function get(url) {
  const found = url.match(queryPattern)
  if (!found) return null
  const queryStr = found[0].replace(queryFlag, '').slice(0, -1) // remove the trailing paramSeparator
  return parse(queryStr)
}

/**
 * Remove the (?||&)queryPattern from the url
 * @param {string} url
 */
export function clear(url) {
  if (queryPattern.test(url)) {
    const replacePattern = RegExp('[?&]' + queryPattern.source)
    return url.replace(replacePattern, '')
  } else {
    return url
  }
}
