import Layout from '@/layout/index'
import i18n from '@/i18n/i18n'
import empty from '@/layout/empty'
import store from '@/store'

import UsersMenu from './users'
import AssetsMenu, { ZonesRoute } from './assets'
import PermsMenu from './perms'
import { CmdAclsRoute } from './acls'
import AccountMenus from './accounts'
import LabelMenus from './labels'

export default {
  path: '/console',
  component: Layout,
  name: 'console',
  redirect: '/console/dashboard',
  meta: {
    title: i18n.t('Console'),
    icon: 'console',
    view: 'console',
    type: 'view',
    showNavSwitcher: () => {
      return store.getters.consoleOrgs.length > 0
    },

    permissions: []
  },
  children: [
    {
      path: '/console/dashboard',
      component: () => import('@/views/dashboard/Console/index.vue'),
      name: 'AdminDashboard',
      // permissions: [] never restricts (see checkPermission), so this always survived
      // filterPermedRoutes regardless of role - a user with zero real Console access still
      // got a "GERENCIAMENTO" category header with only this item inside. Hidden instead
      // whenever the user has no org where they hold rbac.view_console (same signal
      // already used for showNavSwitcher above) - when this is the only surviving item,
      // the category disappears too via groupedSidebarItems' existing empty-category
      // filter, no extra logic needed there.
      hidden: () => store.getters.consoleOrgs.length === 0,
      meta: {
        icon: 'dashboard',
        title: i18n.t('Dashboard'),
        permissions: []
      }
    },
    // "GESTÃO DE USUÁRIOS" wrapper removed - it held 2 visible children (Users/Groups),
    // so it always rendered as a group-title header. Its children are hoisted directly
    // here (fullPath preserved via absolute path override).
    ...UsersMenu.map((route) => ({ ...route, path: `/console/users/${route.path}` })),
    {
      path: '/console/assets',
      component: empty,
      name: 'Assets',
      meta: {
        title: i18n.t('MenuAssets'),
        icon: 'assets'
      },
      children: AssetsMenu
    },
    {
      ...ZonesRoute,
      path: '/console/zones'
    },
    // "GERENCIAMENTO DE CONTA" wrapper removed - it held 2 visible children (Account/
    // account-template; virtual-accounts stays hidden), so it always rendered as a
    // group-title header. Its children are hoisted directly here (fullPath preserved via
    // absolute path override - critical: accounts.js's virtual-accounts redirect/
    // activeMenu hard-code '/console/accounts/accounts').
    ...AccountMenus.map((route) => ({ ...route, path: `/console/accounts/${route.path}` })),
    // "PERMISSÕES" wrapper removed - it held 2 visible children ("Permissões de acesso"
    // and "Controle de acesso"/ACLs), so it always rendered as a group-title header. Its
    // children are hoisted directly here (fullPath preserved via absolute path override -
    // critical for both: PermUser.vue matches on '/console/perms/asset-permissions/', and
    // startup.js's org-switch guard matches on '/console/perms/acls/...').
    ...PermsMenu.map((route) => ({ ...route, path: `/console/perms/${route.path}` })),
    {
      ...CmdAclsRoute,
      path: '/console/cmd-acls'
    },
    // Was nested one level inside a generic "/console/more" (ConsoleMore) wrapper that
    // existed solely to hold this one child - hoisted to a direct top-level entry, wrapper
    // removed.
    ...LabelMenus
  ]
}
