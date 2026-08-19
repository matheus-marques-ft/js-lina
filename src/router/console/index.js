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
      meta: {
        icon: 'dashboard',
        title: i18n.t('Dashboard'),
        permissions: []
      }
    },
    {
      path: '/console/users',
      component: empty,
      name: 'Users',
      meta: {
        title: i18n.t('MenuUsers'),
        icon: 'users'
      },
      children: UsersMenu
    },
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
    {
      path: '/console/accounts',
      component: empty,
      name: 'Accounts',
      meta: {
        title: i18n.t('MenuAccounts'),
        icon: 'key'
      },
      children: AccountMenus
    },
    {
      path: '/console/perms',
      component: empty,
      name: 'Perms',
      meta: {
        // Renamed from the old "ativos de autorização" wording.
        title: i18n.t('Permissões'),
        icon: 'permission',
        resource: 'assetpermission',
        permissions: []
      },
      children: PermsMenu
    },
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
