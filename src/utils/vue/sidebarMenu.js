import path from 'path-browserify'
import { isExternal } from '@/utils/secure'
import { toSentenceCase } from '@/utils/common/index'

export function isItemHidden(item) {
  return typeof item.hidden === 'function' ? item.hidden() : !!item.hidden
}

export function getVisibleChildren(item) {
  return (item.children || []).filter((child) => !isItemHidden(child))
}

// True when a route would render as a real multi-child group (title + list) rather than
// collapse to a single link - 2+ visible children forces that outcome regardless of
// `alwaysShow`/single-child-collapse nuances, so this check alone is unambiguous. Used by
// NavLeft/index.vue to render app-tier groups (e.g. ACLs, Reports) flat, one tier up from
// SidebarItem.vue, so they share the exact same un-wrapped DOM shape as the category headers
// above them instead of sitting one extra <div> deep.
export function isGroupRoute(item) {
  return !isItemHidden(item) && getVisibleChildren(item).length >= 2
}

export function getItemTitle(item) {
  let title = item.meta.menuTitle || item.meta.title
  if (item.meta.level === 2 && item.children) {
    title = title.toUpperCase()
  } else {
    title = toSentenceCase(title)
  }
  return title
}

export function resolveChildPath(basePath, childPath) {
  if (isExternal(childPath)) {
    return childPath
  }
  if (isExternal(basePath)) {
    return basePath
  }
  return path.resolve(basePath, childPath)
}

// Recursively flattens a route tree into a flat list of sidebar rows - a group-title row
// (rendered as a plain heading) or a leaf row (rendered via SidebarItem, which still owns the
// single-child-collapse decision). Applied at ANY depth, not just the direct children of a
// category, so a group nested inside another flattened group (e.g. "Relatório" > "Usuários",
// itself 2 visible children) sits just as flat as a top-tier group like "Relatório" itself -
// neither ever picks up SidebarItem's own wrapper div (see isGroupRoute above).
export function flattenSidebarRows(routes, parentPath = '', isNest = false) {
  const rows = []
  for (const route of routes) {
    const routePath = resolveChildPath(parentPath, route.path)
    if (isGroupRoute(route)) {
      rows.push({ key: routePath, groupTitle: getItemTitle(route) })
      rows.push(...flattenSidebarRows(getVisibleChildren(route), routePath, true))
    } else {
      rows.push({ key: routePath, route, basePath: routePath, isNest })
    }
  }
  return rows
}
