import { constantRoutes } from '@/router'
import store from '@/store'
import { getAssetUrlOr } from '@/utils/assets'

let openedTaskWindow = null // Holds a reference to the already-opened window object

function openOrReuseWindow(
  url,
  windowName = 'task',
  windowFeatures = '',
  iWidth = 900,
  iHeight = 600
) {
  const iTop = (window.screen.height - 30 - iHeight) / 2
  const iLeft = (window.screen.width - 10 - iWidth) / 2

  // Check whether the window is already open
  if (openedTaskWindow && !openedTaskWindow.closed) {
    openedTaskWindow.location.href = url // If the window isn't closed, update its address
    openedTaskWindow.focus() // Bring the window to the foreground
  } else {
    // If the window isn't open or has been closed, create a new window
    openedTaskWindow = window.open(
      url,
      windowName,
      'height=' + iHeight + ',width=' + iWidth + ',top=' + iTop + ',left=' + iLeft
    )
  }
}

export function openTaskPage(taskId, taskType, taskUrl) {
  taskType = taskType || 'celery'
  if (!taskUrl) {
    taskUrl = `/core/ops/${taskType}/task/${taskId}/log/?type=${taskType}`
  }
  openOrReuseWindow(taskUrl)
}

export function checkPermission(permsRequired, permsAll) {
  if (!permsRequired || permsRequired.length === 0) {
    return true
  }
  if (typeof permsRequired === 'string') {
    permsRequired = [permsRequired]
  }
  return permsRequired.every((perm) => {
    // A '|' indicates an OR relationship, handled separately
    if (perm.indexOf('|') === -1) {
      return permsAll.includes(perm)
    }
    const permOr = perm.split('|').map((item) => item.trim())
    return permOr.some((perm) => {
      return permsAll.includes(perm)
    })
  })
}

export function hasPermission(permsRequired) {
  const permsAll = store.getters?.currentOrgPerms || []
  return checkPermission(permsRequired, permsAll)
}

export function getResourceNameByPath(path) {
  const pathSlice = path.split('/')
  const pathValue = pathSlice[pathSlice.length - 1]

  let resource = pathValue.replaceAll('-', '')
  if (resource[resource.length - 1] === 's') {
    resource = resource.slice(0, resource.length - 1)
  }
  return resource
}

export function getResourceFromApiUrl(apiUrl) {
  const re = new RegExp('/api/v1/([A-Za-z0-9_-]+)/([A-Za-z0-9_-]+)/.*')
  const matched = apiUrl.match(re)
  if (!matched) {
    return { path: '', app: '', resource: '' }
  }
  const [path, app, resource] = matched
  const resourceCleaned = getResourceNameByPath(resource)
  const data = { path: path, app: app, resource: resourceCleaned }
  return data
}

export function getResourceFromRoute(route) {
  const meta = route.meta || {}
  if (meta.app && meta.resource) {
    return { path: route.path, view: meta.view, app: meta.app, resource: meta.resource }
  }
  const p = route.path
  const re = new RegExp('/([A-Za-z0-9_-]+)/([A-Za-z0-9_-]+)/([A-Za-z0-9_-]+)')
  const matched = p.match(re)
  if (!matched) {
    return { path: '', view: '', app: '', resource: '' }
  }
  const [path, view, app, resource] = matched
  const resourceCleaned = getResourceNameByPath(resource)
  const data = { path: path, view: view, app: app, resource: resourceCleaned }
  return data
}

export function getRouteRequiredPerms(route, action) {
  const { app, resource } = getResourceFromRoute(route)
  return [`${app}.${action}_${resource}`]
}

export function hasActionPerm(route, action) {
  const permsRequired = getRouteRequiredPerms(route, action)
  return hasPermission(permsRequired)
}

export function getPermedViews() {
  // If you don't understand this, don't mess with it.
  // When a user visits a path without permission, it should normally 404 — but we have an
  // organization-switching feature. When a user switches from org A to org B, if they lack
  // permission in org B, a plain 404 isn't graceful. When a user visits a path, we extract the
  // view from the path and check whether they have permission for it; if not, we search
  // top-down for the first view they do have permission for.
  // This should include every view, otherwise refreshing the page could also cause a redirect.
  const viewShowMapper = [
    ['console', store.getters.consoleOrgs.length > 0],
    ['audit', store.getters.auditOrgs.length > 0],
    ['pam', store.getters.pamOrgs.length > 0],
    ['workbench', true],
    ['tickets', hasPermission('tickets.view_ticket')],
    ['settings', hasPermission('settings.view_setting')]
  ]
  return viewShowMapper.filter((i) => i[1]).map((i) => i[0])
}

export function isSameView(to, from) {
  const fromView = from?.path.split('/')[1]
  const toView = to?.path.split('/')[1]
  return fromView === toView
}

export function getPropView() {
  const hasPermedViews = getPermedViews()
  const preView = localStorage.getItem('preView')
  const hasPerm = hasPermedViews.indexOf(preView) > -1
  if (hasPerm) {
    return preView
  }
  const preferView = getPermedViews()[0]
  if (preferView) {
    return preferView
  }
  return ''
}

export function getApiUrlRequirePerms(url, action) {
  const { app, resource } = getResourceFromApiUrl(url)
  return [`${app}.${action}_${resource}`]
}

export function isViewHasOrgs(viewName) {
  return getPermedViews().indexOf(viewName) > -1
}

export function getConstRouteName() {
  const names = []
  const constRoutes = constantRoutes
  const addRoutes = (all, routes) => {
    for (const route of routes) {
      names.push(route.name)
      if (route.children) {
        addRoutes(all, route.children)
      }
    }
  }
  addRoutes(names, constRoutes)
  return names
}

export function toM2MJsonParams(attrFilter) {
  const encoder = new TextEncoder()
  const data = encoder.encode(JSON.stringify(attrFilter))
  return ['attr_rules', encodeURIComponent(btoa(String.fromCharCode(...data)))]
}

export function toM2MInstanceJsonParams(instanceAppModel, instanceId) {
  const encoder = new TextEncoder()
  const [app, model] = instanceAppModel.split('.')
  const data = encoder.encode(
    JSON.stringify({
      app,
      model,
      id: instanceId
    })
  )
  return ['attr_rules_instance', encodeURIComponent(btoa(String.fromCharCode(...data)))]
}

export function IsSupportPauseSessionType(terminalType) {
  const supportedType = ['koko', 'lion', 'chen', 'kael']
  return supportedType.includes(terminalType)
}

export function loadPlatformIcon(name, type) {
  const platformMap = {
    Huawei: 'huawei',
    Cisco: 'cisco',
    Gateway: 'gateway',
    macOS: 'macos',
    BSD: 'bsd',
    'Vmware-vSphere': 'vmware'
  }

  const value = platformMap[name] || type

  return getAssetUrlOr(`img/icons/${value}.png`, 'img/icons/other.png')
}
