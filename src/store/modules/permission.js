import { constantRoutes, viewRoutes } from '@/router'
import empty from '@/layout/empty'
import Layout from '@/layout/index'
import { getResourceNameByPath, hasPermission } from '@/utils/jms/index'
import i18n from '@/i18n/i18n'
import _ from 'lodash'

function hasLicense(route, rootState) {
  const licenseIsValid = rootState.settings.hasValidLicense
  const licenseRequired = route.meta?.licenseRequired
  return !(!licenseIsValid && licenseRequired)
}

function isNeedHidden(route, rootState) {
  let hidden = route.meta ? route.meta.hidden : false
  if (typeof hidden === 'function') {
    hidden = hidden({ route: route, settings: rootState.settings.publicSettings })
  }
  return hidden
}

export function filterHiddenRoutes(routes, rootState) {
  const res = []

  routes.forEach((route) => {
    const tmp = {
      ...route
    }
    if (!isNeedHidden(route, rootState) && hasLicense(route, rootState)) {
      if (tmp.children) {
        tmp.children = filterHiddenRoutes(tmp.children, rootState)
      }
      res.push(tmp)
    }
  })

  return res
}

const actionMapper = {
  create: 'add',
  update: 'change',
  list: 'view',
  destroy: 'del',
  retrieve: 'view'
}

function getRouteDefaultPerms(route) {
  if (route.component === empty || route.component === Layout) {
    return []
  }

  const permAction = actionMapper[route.meta.action] || 'view'
  const resource = route.meta.resource
  const app = route.meta.app
  return [`${app}.${permAction}_${resource}`]
}

function cleanRouteAction(route) {
  let action = ''
  const path = route.path || ''
  if (path.indexOf('create') > -1) {
    action = 'create'
  } else if (path.indexOf('update') > -1) {
    action = 'update'
  } else if (path.indexOf('delete') > -1) {
    action = 'destroy'
  } else if (path.indexOf(':id') > -1) {
    action = 'retrieve'
  } else {
    action = 'list'
  }
  return action
}

function cleanRoute(tmp, parent) {
  if (!parent) {
    parent = { meta: { level: 0, fullPath: '' } }
  }
  if (!parent.meta) {
    parent.meta = {}
  }
  if (!tmp.meta) {
    tmp.meta = {}
  }

  // Determine whether the type is view, app, resource, or crud based on the level
  if (!tmp.meta.level) {
    tmp.meta.level = parent.meta.level + 1
  }
  const typeMapper = { 1: 'view', 2: 'app', 3: 'resource', 4: 'crud' }
  if (!tmp.meta.type) {
    tmp.meta.type = typeMapper[tmp.meta.level] || 'crud'
  }

  const path = tmp.path || ''
  const pathSlice = path.split('/')
  const pathValue = pathSlice[pathSlice.length - 1]

  // No longer auto-generating name (vue-router 5 strictly errors on
  // parent/child sharing the same name, and container routes don't need a name —
  // nothing navigates to them by name)

  // Identify which view the route belongs to
  if (!tmp.meta.view) {
    tmp.meta.view = tmp.meta.level === 1 ? pathValue : parent.meta?.view
  }
  // Identify which Django app the route belongs to
  if (!tmp.meta.app && tmp.meta.level >= 2) {
    tmp.meta.app = tmp.meta.level === 2 ? pathValue : parent.meta?.app
  }
  // Identify which resource (Model) the route belongs to
  if (!tmp.meta.resource && tmp.meta.level >= 3) {
    // A dynamic segment (':id') isn't a resource name - deriving one from it
    // literally (getResourceNameByPath(':id') -> ':id') produced a bogus
    // permission like 'terminal.view_:id' that's always false, silently
    // dropping the route from registration while $hasPerm at render time
    // (checking the real permission) still rendered a router-link to it -
    // e.g. SessionDetail (path: ':id') vs its sibling list route. Inherit
    // from the parent instead, same as any level above 3 already does.
    const isDynamicSegment = pathValue.startsWith(':')
    tmp.meta.resource = (tmp.meta.level === 3 && !isDynamicSegment)
      ? getResourceNameByPath(pathValue)
      : parent.meta?.resource
  }
  // Identify the route's action
  if (!tmp.meta.action) {
    tmp.meta.action = cleanRouteAction(tmp)
  }
  // Set the default permissions
  if (!tmp.meta.permissions) {
    tmp.meta.permissions = getRouteDefaultPerms(tmp)
  }
  // Set whether to show Organization; this parameter is inherited
  if (!tmp.meta.showOrganization && parent.meta.showOrganization !== undefined) {
    tmp.meta.showOrganization = parent.meta.showOrganization
  }

  if (!tmp.meta.disableOrgsChange && parent.meta.disableOrgsChange !== undefined) {
    tmp.meta.disableOrgsChange = parent.meta.disableOrgsChange
  }

  // Translate the title
  if (tmp.meta.title) {
    tmp.meta.title = i18n.global.t(tmp.meta.title)
  }
  if (tmp.meta.menuTitle) {
    tmp.meta.menuTitle = i18n.global.t(tmp.meta.menuTitle)
  }
  // Set fullPath
  const parentFullPath = _.trimEnd(parent.meta.fullPath, '/')
  if (!tmp.meta.fullPath) {
    if (tmp.path && tmp.path[0] === '/') {
      tmp.meta['fullPath'] = tmp.path
    } else {
      tmp.meta.fullPath = parentFullPath ? parentFullPath + '/' + tmp.path : parentFullPath
    }
    // debug('Full path: ', tmp.meta.fullPath)
  }
  // Set the default active menu
  if (tmp.meta.type === 'crud' && !tmp.meta.activeMenu) {
    tmp.meta.activeMenu = parentFullPath
    // Todo
  }
  return tmp
}

// A merged top-level route (e.g. the Console/PAM/Audit/Workbench union) tags itself with
// an array of view names instead of a single string - match either shape.
function routeMatchesView(route, viewName) {
  const v = route.meta?.view
  return Array.isArray(v) ? v.includes(viewName) : v === viewName
}

export function filterPermedRoutes(routes, parent) {
  const res = []

  for (const route of routes) {
    let tmp = {
      ...route
    }
    tmp = cleanRoute(tmp, parent)

    if (hasPermission(tmp.meta.permissions)) {
      if (tmp.children) {
        tmp.children = filterPermedRoutes(tmp.children, tmp)
      }
      res.push(tmp)
    }
  }
  return res
}

const state = {
  routes: [],
  currentViewRoute: {},
  addRoutes: []
}

const mutations = {
  SET_ROUTES: (state, { routes }) => {
    state.addRoutes = routes
    state.routes = routes.concat(constantRoutes)
  },
  SET_VIEW_ROUTE: (state, viewRoute) => {
    console.debug('Current view route: ', viewRoute)
    state.currentViewRoute = viewRoute
  }
}

const actions = {
  generateViewRoutes({ commit, rootState }, { to, from }) {
    console.log('Start generate view routes, to: ', to, 'from: ', from)
    return new Promise((resolve) => {
      const path = to.path
      const re = new RegExp('/(\\w+)/?.*')
      const matched = path.match(re)
      if (!matched) {
        console.debug('Not match path, set default routes', path)
        commit('SET_VIEW_ROUTE', constantRoutes[0])
        resolve(constantRoutes[0])
        return
      }
      const viewName = matched[1]
      console.log('View name: ', viewName)
      let viewRoute = {}
      for (const route of state.routes) {
        if (routeMatchesView(route, viewName)) {
          viewRoute = route
          break
        }
      }
      console.log('Set view route: ', viewRoute)
      commit('SET_VIEW_ROUTE', viewRoute)
      resolve(viewRoute)
    })
  },
  generateRoutes({ commit, dispatch, rootState }, { to, from }) {
    return new Promise((resolve) => {
      let routes = filterPermedRoutes(viewRoutes, null)
      routes = filterHiddenRoutes(routes, rootState)
      if (routes.length === 0) {
        console.error('No route find')
      } else {
        console.debug('All routes in vuex: ', routes)
      }
      commit('SET_ROUTES', { routes })
      resolve(routes)
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
