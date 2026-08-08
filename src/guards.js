/* eslint-disable no-unused-vars */
import router from './router'
import 'nprogress/nprogress.css' // progress bar style
import { startup } from '@/utils/startup'
import store from '@/store'
import { isSameView } from '@/utils/jms/index'
import { toSentenceCase } from '@/utils/common/index'
import { scopedLocalStorage as localStorage } from '@/utils/storage'
import i18n from '@/i18n/i18n'

function beforeRouteChange(to, from) {
  localStorage.setItem('activeTab', '')
}

router.beforeEach(async (to, from) => {
  // start progress bar
  // NProgress.start()
  try {
    // Only clean up the drawer meta and close the drawer when actually switching pages (path/name changed).
    // A query/hash change on the same route (e.g. clicking a tab inside a drawer's detail TabPage triggering
    // $router.replace({query:{tab}})) should not be treated as leaving the page, otherwise the drawer would be closed by mistake.
    const isSameRouteQueryChange = to.path === from.path && to.name === from.name
    if (!isSameRouteQueryChange) {
      await store.dispatch('common/cleanDrawerActionMeta')
    }
    const startupResult = await startup({ to, from })
    if (startupResult && startupResult !== true) {
      return startupResult
    }
    if (to.name && from.name && to.name !== from.name) {
      await beforeRouteChange(to, from)
    }
    return true
  } catch (e) {
    const msg = 'Start service error: ' + e
    console.log(msg)
    return false
  }
})

function generateViewRoutesIfChange({ to, from }) {
  const sameView = isSameView(to, from)
  console.log('sameView', sameView)
  // On first load, after startup's replace navigation, from/to may be same view.
  // Ensure we still set currentViewRoute if it hasn't been set.
  const hasCurrent = !!store.state?.permission?.currentViewRoute?.meta?.view
  if (!sameView || !hasCurrent) {
    console.log('generateViewRoutesIfChange', to, from)
    return store.dispatch('permission/generateViewRoutes', { to: to, from: from })
  }
}

function setPageTitle() {
  const currentRoute = router.currentRoute?.value || router.currentRoute
  const loginTitle = store.getters.publicSettings['INTERFACE']['login_title']
  const rawTitle = currentRoute?.meta?.title
  // meta.title is evaluated with i18n.t(...) when the route module is loaded, at which point the backend's
  // translations haven't been fetched yet, so the value gets frozen as the English key; here we translate it
  // again at runtime (once translations are ready) to make sure the tab title is translated correctly.
  const routeTitle = rawTitle ? toSentenceCase(i18n.global.t(rawTitle)) : ''
  if (routeTitle) {
    document.title = routeTitle + ' - ' + loginTitle
  }
}

router.afterEach(async (to, from) => {
  // finish progress bar
  await setPageTitle()
  await generateViewRoutesIfChange({ to, from })
  try {
    const view = store.state?.permission?.currentViewRoute?.meta?.view
    if (view) {
      console.log('generateViewRoutes done:', view)
    } else {
      console.log('generateViewRoutes done: no currentViewRoute yet')
    }
  } catch (e) {
    console.log('log currentViewRoute failed', e)
  }
  // NProgress.done()
})
