import { VueCookieNext } from 'vue-cookie-next'

/**
 * Create a cookie compatibility object
 * Provides a unified cookie operation interface
 *
 * @returns {Object} cookie compatibility object
 */
function createCookieCompat() {
  return {
    get: VueCookieNext.getCookie.bind(VueCookieNext),
    set: VueCookieNext.setCookie.bind(VueCookieNext),
    delete: VueCookieNext.removeCookie.bind(VueCookieNext),
    getCookie: VueCookieNext.getCookie.bind(VueCookieNext),
    setCookie: VueCookieNext.setCookie.bind(VueCookieNext),
    removeCookie: VueCookieNext.removeCookie.bind(VueCookieNext)
  }
}

/**
 * Cookie plugin
 * Unified wrapper for all cookie-related setup
 */
const CookiePlugin = {
  install(app) {
    // Register the VueCookieNext plugin
    app.use(VueCookieNext)

    // Create the cookie compatibility object
    const cookieCompat = createCookieCompat()

    // Attach it to the Vue global properties
    app.config.globalProperties.$cookie = cookieCompat

    // Attach it to the window object
    window.$cookie = cookieCompat
  }
}

// Export the plugin for use with app.use()
export default CookiePlugin

// Export VueCookieNext for use elsewhere
export { VueCookieNext }
