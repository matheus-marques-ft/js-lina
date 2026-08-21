import Layout from '@/layout'
import i18n from '@/i18n/i18n'

import consoleView from './console'
import pamView from './pam'
import auditView from './audit'
import workbenchView from './workbench'

// Console/PAM/Audit/Workbench used to be 4 separate top-level views, each with its own
// sidebar. They're merged here into one screen, one level only: each view's own children
// (its "app" nodes - Users/Assets/... for Console, Security/Automation/... for PAM, etc.)
// become children of a single root, tagged with which original view they came from so the
// sidebar can still group them into sections. Nothing below this level changes - every
// sub-route file (console/users.js, pam/security.js, audit/sessions.js, workbench/*) is
// untouched, still exported and consumed exactly as before.
function prepareCategoryChildren(viewRoute, category) {
  // The old per-view root often carried its own permission gate (e.g. workbench requires
  // 'rbac.view_workbench'); since that root disappears, its gate has to be folded into
  // every child or that permission check is silently lost.
  const gate = viewRoute.meta?.permissions || []
  return (viewRoute.children || []).map((child) => ({
    ...child,
    meta: {
      ...child.meta,
      category,
      type: 'app',
      permissions: [...gate, ...(child.meta?.permissions || [])]
    }
  }))
}

export default {
  path: '/console',
  component: Layout,
  name: 'MainMenu',
  redirect: '/console/dashboard',
  meta: {
    title: i18n.t('Console'),
    icon: 'console',
    view: ['console', 'pam', 'audit', 'workbench'],
    type: 'view',
    permissions: []
  },
  children: [
    ...prepareCategoryChildren(consoleView, 'console'),
    ...prepareCategoryChildren(pamView, 'pam'),
    ...prepareCategoryChildren(auditView, 'audit'),
    ...prepareCategoryChildren(workbenchView, 'workbench'),
    // Only pamView/auditView/workbenchView's *children* got flattened above - their own
    // root route (bare '/pam', '/audit', '/workbench' -> its dashboard) is gone along with
    // it, so re-add it as a plain hidden redirect. Console doesn't need one: this merged
    // root's own path/redirect already covers bare '/console'.
    { path: pamView.path, redirect: pamView.redirect, hidden: true, meta: { permissions: [] } },
    { path: auditView.path, redirect: auditView.redirect, hidden: true, meta: { permissions: [] } },
    {
      path: workbenchView.path,
      redirect: workbenchView.redirect,
      hidden: true,
      meta: { permissions: [] }
    }
  ]
}
