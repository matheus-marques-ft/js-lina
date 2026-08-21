// import getPageTitle from '@/utils/get-page-title'
import store from '@/store'
import router, { addDynamicRoute, resetRouter } from '@/router'
import { message } from '@/utils/vue/message'
import orgUtil from '@/utils/jms/org'
import orgs from '@/api/orgs'
import { getPropView, isViewHasOrgs } from '@/utils/jms/index'
import { LOGIN_PATH } from '@/utils/env'

const whiteList = ['/login', LOGIN_PATH] // no redirect whitelist
const autoEnterOrgs = [
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000'
]

function reject(msg) {
  return new Promise((resolve, reject) => reject(msg))
}

async function beforeGoToLogin() {
  // remove currentOrg: System org item
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key.startsWith('currentOrg:')) {
      continue
    }
    let value = localStorage.getItem(key)
    value = JSON.parse(value)
    if (!value.is_system) {
      continue
    }
    localStorage.removeItem(key)
  }
  if (store.getters.currentOrg.autoEnter) {
    await store.dispatch('users/setCurrentOrg', store.getters.preOrg)
  }
}

async function checkLogin({ to, from }) {
  if (whiteList.indexOf(to.path) !== -1) {
    return true
  }

  try {
    return await store.dispatch('users/getProfile')
  } catch (e) {
    console.error(e)
    await beforeGoToLogin()
    return reject('No profile get: ' + e)
  }
}

async function getPublicSetting({ to, from }, isOpen) {
  // Fetch the public settings
  const publicSettings = store.getters.publicSettings
  if (!publicSettings || Object.keys(publicSettings).length === 0 || !isOpen) {
    await store.dispatch('settings/getPublicSettings', isOpen)
  }
}

async function refreshCurrentOrg() {
  return orgs.getCurrentOrg().then((org) => {
    // Don't refresh the local one for Root, it would affect autoEnter
    if (autoEnterOrgs.indexOf(org.id) !== -1) {
      return
    }
    store.dispatch('users/setCurrentOrg', org)
  })
}

async function changeCurrentOrgIfNeed({ to, from }) {
  await store.dispatch('users/getProfile')

  const usingOrgs = store.getters.usingOrgs
  if (!usingOrgs || usingOrgs.length === 0) {
    console.debug('No using orgs, return: ', usingOrgs)
    return
  }
  await refreshCurrentOrg()
  const currentOrg = store.getters.currentOrg
  if (!currentOrg || typeof currentOrg !== 'object') {
    console.error('Current org is null or not a object: ', currentOrg)
    await orgUtil.change2PropOrg()
  }
  const globalOrgPath = [
    '/console/perms/acls/login-acls',
    '/console/users/roles',
    '/console/perms/acls/connect-method-acls',
    '/settings'
  ]
  if (autoEnterOrgs.indexOf(currentOrg.id) !== -1 && currentOrg.autoEnter) {
    const delta = new Date().getTime() - currentOrg.autoEnter
    const notNeedChange = globalOrgPath.find((path) => to.path.indexOf(path) === 0)
    if (!notNeedChange && delta > 3000) {
      await orgUtil.change2PropOrg()
    }
    return
  }
  if (!orgUtil.hasCurrentOrgPermission()) {
    console.error('Not has current org permission: ', currentOrg)
    await orgUtil.change2PropOrg()
  }
}

export async function generatePageRoutes({ to, from }) {
  // determine whether the user has obtained his permission roles through getProfile
  resetRouter()

  try {
    // try get user profile
    // generate accessible routes map based on roles
    const accessRoutes = await store.dispatch('permission/generateRoutes', { to, from })
    // dynamically add accessible routes
    console.debug(
      'All routes:',
      accessRoutes.reduce((acc, cur) => {
        acc[cur.name] = cur
        return acc
      }, {})
    )
    // vue-router 5 doesn't allow a parent and child route to share a name; deduplicate recursively:
    // if the parent's name collides with a descendant's, drop the parent's name
    function deduplicateRouteNames(routes, ancestorNames = new Set()) {
      for (const route of routes) {
        if (route.name && ancestorNames.has(route.name)) {
          // The child route's name collides with an ancestor's; drop the child's (keep the ancestor's, the child matches by path)
          delete route.name
        }
        if (route.children && route.children.length > 0) {
          const childNames = new Set()
          for (const child of route.children) {
            if (child.name) childNames.add(child.name)
          }
          // If the parent's name matches a child's name, drop the parent's name (the parent is just a container)
          if (route.name && childNames.has(route.name)) {
            delete route.name
          }
          const newAncestors = new Set(ancestorNames)
          if (route.name) newAncestors.add(route.name)
          deduplicateRouteNames(route.children, newAncestors)
        }
      }
    }
    deduplicateRouteNames(accessRoutes)

    accessRoutes.forEach((route) => {
      try {
        addDynamicRoute(route)
      } catch (e) {
        console.warn('addRoute failed:', route.name || route.path, e.message)
      }
    })

    await store.dispatch('permission/generateViewRoutes', { to, from })

    // hack method to ensure that addRoutes is complete
    // set the replace: true, so the navigation will not leave a history record
    // console.debug('Next to: ', to)
    return { path: to.path, query: to.query, hash: to.hash, replace: true }
  } catch (error) {
    // remove token and go to login page to re-login
    // await store.dispatch('user/resetToken')
    message.error(error || 'Has Error')
    console.error('Error occur: ', error)
  }
}

async function regenerateMissingRoute({ to, from }) {
  await store.dispatch('users/getProfile', true)
  const pageRoutesResult = await generatePageRoutes({ to, from })
  const resolvedRoute = router.resolve({ path: to.path, query: to.query, hash: to.hash })
  if (['404', 'NotFound'].includes(resolvedRoute?.name)) {
    return true
  }
  return pageRoutesResult
}

export async function checkUserFirstLogin({ to, from, next }) {
  // Prevent recursive calls
  if (to.path === '/profile/improvement') return true
  if (store.state.users.profile.is_first_login) {
    return {
      name: 'Improvement',
      replace: true,
      query: { _t: Date.now() } // Add a timestamp to prevent an identical `from` from skipping the router.beforeEach logic in guard.js
    }
  } else {
    const nextRoute = localStorage.getItem('next')
    if (nextRoute) {
      localStorage.setItem('next', '')
      return nextRoute.replace('#', '')
    }
  }
  return true
}

export async function changeCurrentViewIfNeed({ to, from }) {
  let viewName = to.path.split('/')[1]
  // These are the ones that need checking, to avoid 404s when switching view organizations. Don't add
  // settings here, because by default the management permission for the setting (System) organization isn't returned
  if (['console', 'audit', 'pam', 'workbench', 'tickets', ''].indexOf(viewName) === -1) {
    console.debug('Current view no need check', viewName)
    return
  }

  const has = isViewHasOrgs(viewName)
  console.debug('Change has current view, has perm: ', viewName, '=>', has)
  if (has) {
    await store.dispatch('users/changeToView', viewName)
    return true
  }
  const preferView = getPropView()
  // If there's no available view, allow the navigation directly to avoid an infinite redirect
  if (!preferView || preferView === viewName) {
    return true
  }
  viewName = preferView
  // The init state must be reset before Next, otherwise these route guards won't run
  await store.dispatch('app/reset')
  return `/${viewName}`
}

function onI18nLoaded() {
  return new Promise((resolve) => {
    const load = store.state.app.i18nLoaded
    if (load) {
      resolve()
    }
    const itv = setInterval(() => {
      const load = store.state.app.i18nLoaded
      if (load) {
        clearInterval(itv)
        resolve()
      }
    }, 100)
  })
}

export async function startup({ to, from, next }) {
  // if (store.getters.inited) { return true }
  if (store.getters.inited) {
    if (['404', 'NotFound'].includes(to?.name)) {
      return regenerateMissingRoute({ to, from })
    }
    // Also needs checking after the page has been initialized
    const firstLoginResult = await checkUserFirstLogin({ to, from })
    if (firstLoginResult && firstLoginResult !== true) {
      return firstLoginResult
    }
    return true
  }

  try {
    await store.dispatch('app/init')

    // set page title
    // await getOpenPublicSetting({ to, from, next })
    await getPublicSetting({ to, from }, true)
    await checkLogin({ to, from })
    await onI18nLoaded()
    await getPublicSetting({ to, from }, false)
    const viewResult = await changeCurrentViewIfNeed({ to, from })
    if (viewResult && viewResult !== true) return viewResult
    await changeCurrentOrgIfNeed({ to, from })
    const pageRoutesResult = await generatePageRoutes({ to, from })
    if (pageRoutesResult && pageRoutesResult !== true) return pageRoutesResult
    const firstLoginResult = await checkUserFirstLogin({ to, from })
    if (firstLoginResult && firstLoginResult !== true) return firstLoginResult
    await store.dispatch('assets/getAssetCategories')
  } catch (e) {
    console.error('Startup error: ', e)
    // checkLogin's rejection (unauthenticated - profile fetch 401'd) means everything after
    // it in the try block never ran, including generatePageRoutes() - so no view routes
    // (e.g. /workbench/home) are registered yet. Falling through to `return true` below would
    // tell the caller navigation is fine, letting downstream guards (e.g. this route's own
    // beforeEnter computing a preferred view) try to redirect into one of those unregistered
    // routes - producing a "No match found for location" loop instead of ever reaching the
    // login page. Cancel navigation instead; the axios response interceptor's ifUnauthorized
    // already scheduled a hard redirect to LOGIN_PATH for this exact 401, independently.
    if (String(e).includes('No profile get')) {
      return false
    }
  }
  return true
}
