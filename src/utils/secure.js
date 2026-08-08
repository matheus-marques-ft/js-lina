/**
 * Created by PanJiaChen on 16/11/18.
 */

import xss from 'xss'
import JSEncrypt from 'jsencrypt'
import CryptoJS from 'crypto-js'
import { VueCookieNext as VueCookie } from 'vue-cookie-next'

/**
 * @param {string} path
 * @returns {Boolean}
 */
export function isExternal(path) {
  return /^(https?:|mailto:|tel:)/.test(path)
}

/**
 * @param {string} str
 * @returns {Boolean}
 */
export function validUsername(str) {
  const valid_map = ['admin', 'editor']
  return valid_map.indexOf(str.trim()) >= 0
}

const excludeTags = ['iframe', 'script']

const options = {
  css: false,
  stripIgnoreTagBody: ['script'],
  onTag(tag, html, options) {
    if (excludeTags.indexOf(tag) !== -1) {
      return html.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }
  },
  // Avoid stripping out page styles
  onTagAttr(tag, name, value, isWhiteAttr) {
    // Strip out event handlers on tags
    if (/^on/.test(name)) {
      return name + '=' + '.'
    }
    if (['src', 'href'].indexOf(name) !== -1) {
      return name + '=' + value.replace('javascript:', 'java:').replace('data:', 'dt:')
    }
    return name + '="' + xss.escapeAttrValue(value) + '"'
  }
}
const filter = new xss.FilterXSS(options)

export function fillKey(key) {
  const KeyLength = 16
  if (key.length > KeyLength) {
    key = key.slice(0, KeyLength)
  }
  // Browsers don't have Node's Buffer; use Uint8Array + TextEncoder to produce an equivalent 16-byte key
  const filledKey = new Uint8Array(KeyLength)
  const keys = new TextEncoder().encode(key)
  for (let i = 0; i < keys.length && i < KeyLength; i++) {
    filledKey[i] = keys[i]
  }
  return filledKey
}

function bytesToHex(bytes) {
  let hex = ''
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0')
  }
  return hex
}

export function aesEncrypt(text, originKey) {
  // Byte-equivalent to the old implementation (Utf8.parse(Buffer)): parse the 16-byte key as Hex into a WordArray
  const key = CryptoJS.enc.Hex.parse(bytesToHex(fillKey(originKey)))
  return CryptoJS.AES.encrypt(text, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.ZeroPadding
  }).toString()
}

export function rsaEncrypt(text, pubKey) {
  const jsEncrypt = new JSEncrypt()
  jsEncrypt.setPublicKey(pubKey)
  return jsEncrypt.encrypt(text)
}

export function getCookie(name) {
  return VueCookie.getCookie(name)
}

export function encryptPassword(password) {
  if (!password) {
    return ''
  }
  let rsaPublicKeyText = getCookie('jms_public_key')
  if (!rsaPublicKeyText) {
    return password
  }
  const aesKey = (Math.random() + 1).toString(36).substring(2)
  // The public key is stored as base64
  rsaPublicKeyText = rsaPublicKeyText.replaceAll('"', '')
  const rsaPublicKey = atob(rsaPublicKeyText)
  const keyCipher = rsaEncrypt(aesKey, rsaPublicKey)
  const passwordCipher = aesEncrypt(String(password), aesKey)
  return `${keyCipher}:${passwordCipher}`
}

window.aesEncrypt = aesEncrypt
window.fillKey = fillKey

export default filter
