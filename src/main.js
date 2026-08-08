import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import { getElementLocale } from '@/i18n/langs'
import { getLangCode } from '@/i18n/utils'
import 'element-plus/dist/index.css'
// Import the Element Plus CSS variable config (must come after Element Plus styles, before custom styles)
import '@/styles/element-plus-vars.scss'
// Import the default theme config (contains the :root CSS variable definitions)
import '@/styles/default-theme.scss'
import '@/styles/index.scss' // global css
// Import and initialize the default theme config
import { setRootColors } from '@/utils/theme/color'
import App from './App.vue'
import store from './store'
import router from './router'
import { eventBus } from './utils/vue/eventbus'
import '@/styles/fonts/loadSans'
import { watchSessions } from './utils/jms/auth'

import { installSvgIcon } from '@/icons' // icon
import { installElementPlusIcons } from '@/icons/element-plus-icons'
import '@/guards' // permission control
import { installDirectives } from '@/directive'
import i18n, { fetchTranslationsFromAPI } from './i18n/i18n'
import ChartsPlugin from '@/libs/charts'
import createContextService from '@/libs/context'
import { setupErrorHandler } from '@/libs/errors'
import CookiePlugin from '@/libs/cookie'
import ResourceActivity from '@/components/Apps/ResourceActivity'
import request from '@/utils/request'
import { message } from '@/utils/vue/message'
import { toPlainTextMessage } from '@/utils/common/message'
import xss from '@/utils/secure'
import moment from 'moment'
import DOMPurify from 'dompurify'
import _ from 'lodash'
import { ElMessageBox } from 'element-plus'

moment.locale('zh-cn')

// Build time: in production this is the Docker build moment, in development it's when the dev server started (see vite.config.js)
// Printed with a two-tone badge style to stand out from other console messages.
console.log(
  `%c 🚀 Lina %c Build Time: ${__BUILD_TIME__} %c`,
  'background:#409eff;color:#fff;padding:4px 8px;border-radius:4px 0 0 4px;font-weight:bold',
  'background:#1f2d3d;color:#67c23a;padding:4px 8px;border-radius:0 4px 4px 0;font-weight:bold',
  'background:transparent'
)

async function initApp() {
  const app = createApp(App)

  // i18n helpers (set immediately to avoid undefined)
  const identityT = (key, ...rest) => {
    try {
      return i18n.global.t(key, ...rest)
    } catch (e) {
      return key
    }
  }
  const identityTc = (key, choice, ...rest) => {
    try {
      return i18n.global.tc(key, choice, ...rest)
    } catch (e) {
      return key
    }
  }
  app.config.globalProperties.$t = identityT
  app.config.globalProperties.$tc = identityTc

  app.use(store)
  app.use(router)
  app.use(i18n)
  app.use(ElementPlus, {
    locale: getElementLocale(getLangCode()),
    size: 'small'
  })
  app.use(CookiePlugin)
  app.use(ChartsPlugin)
  app.use(createContextService({ router }))

  // v-sanitize: registered manually (the v-sanitize npm package uses Vue.prototype, incompatible with Vue 3)
  const sanitizeOptions = {
    ALLOW_DATA_ATTR: true
  }
  app.config.globalProperties.$sanitize = (dirty, opts) =>
    DOMPurify.sanitize(dirty || '', { ...sanitizeOptions, ...opts })
  app.directive('sanitize', (el, binding) => {
    if (binding.value !== binding.oldValue) {
      el.innerHTML = DOMPurify.sanitize(binding.value || '', sanitizeOptions)
    }
  })

  installDirectives(app)
  installSvgIcon(app)
  installElementPlusIcons(app)

  // Register the dynamic component globally (referenced by GenericDetailPage submenu via string name)
  app.component('ResourceActivity', ResourceActivity)

  app.config.globalProperties.$moment = moment
  app.config.globalProperties.$axios = request
  app.config.globalProperties.$message = message
  app.config.globalProperties.$alert = (msg, title, options = {}) => {
    const plainText = typeof msg === 'string' ? toPlainTextMessage(msg) : msg
    return ElMessageBox.alert(plainText, title, options)
  }
  app.config.globalProperties.$xss = xss
  app.config.globalProperties.$eventBus = eventBus
  app.config.globalProperties._ = _
  app.config.globalProperties.$log = console
  // Override with i18n-bound functions after plugin install
  app.config.globalProperties.$t = identityT
  app.config.globalProperties.$tc = identityTc

  // Set up the global error handler
  setupErrorHandler(app, message)

  window._ = _
  // v-html is uniformly transformed to window.$xss.process(...) during template compilation
  window.$xss = xss

  // Initialize default theme variables (ensures CSS variables are injected as soon as the app starts)
  setRootColors()

  await fetchTranslationsFromAPI()
  watchSessions()
  // Mount app and remove initial loading overlay
  app.mount('#app')
  try {
    const el = document.getElementById('loading')
    if (el && el.parentNode) {
      el.parentNode.removeChild(el)
    }
  } catch (e) {
    // ignore
  }
}

initApp().then()
