import Layout from '@/layout'
import i18n from '@/i18n/i18n'

import empty from '@/layout/empty'
import automations from './automations'
import integrations from './integrations'
import security from './security'
import activity from './activity'
import store from '@/store'

export default {
  path: '/pam/',
  component: Layout,
  name: 'pam',
  redirect: '/pam/dashboard',
  meta: {
    title: i18n.t('PAM'),
    icon: 'pam',
    view: 'pam',
    type: 'view',
    showNavSwitcher: () => {
      return store.getters.pamOrgs.length > 0
    },
    permissions: []
  },
  children: [
    {
      path: '/pam/dashboard',
      component: () => import('@/views/dashboard/Pam/index'),
      name: 'PamDashboard',
      // permissions: [] never restricts (see checkPermission), so this always survived
      // filterPermedRoutes regardless of role - a user with zero real PAM access still got
      // a "PAM" category header with only this item inside. Hidden instead whenever the
      // user has no org where they hold rbac.view_pam (same signal already used for
      // showNavSwitcher above) - when this is the only surviving item, the whole category
      // disappears too via groupedSidebarItems' existing empty-category filter.
      hidden: () => store.getters.pamOrgs.length === 0,
      meta: {
        icon: 'dashboard',
        title: i18n.t('Dashboard'),
        permissions: []
      }
    },
    {
      path: '/pam/accounts',
      name: 'PamAccounts',
      // Redundant with Console's "Contas de ativos" (same underlying accounts resource) -
      // hidden from the menu, but the route stays registered since it's still reached by
      // name from views/reports/pam/Dashboard/DataSummary.vue.
      hidden: true,
      component: () => import('@/views/accounts/PAM/index.vue'),
      meta: {
        title: i18n.t('AccountList'),
        icon: 'accounts',
        permissions: ['accounts.view_account']
      }
    },
    // "AUTOMATIZAÇÃO" and "CONFIGURAÇÕES DE SEGURANÇA" wrappers removed - each held
    // multiple visible children, so they always rendered as a group-title header. Their
    // children are hoisted directly here (fullPath preserved via absolute path override,
    // same pattern as the Domínios/Tags promotions in console/index.js).
    ...automations.map((route) => ({ ...route, path: `/pam/automations/${route.path}` })),
    ...security.map((route) => ({ ...route, path: `/pam/security/${route.path}` })),
    {
      path: '/pam/integrations',
      name: 'Integrations',
      component: empty,
      meta: {
        title: i18n.t('Integration'),
        icon: 'accounts',
        permissions: []
      },
      children: integrations
    },
    {
      path: '/pam/activity',
      name: 'AccountActivityMenu',
      // Both children (AccountSession/AccountActivity) are hidden below - hiding only the
      // children wouldn't hide this wrapper too (allChildrenHidden() checks nesting, not
      // each child's own `hidden` flag), so it needs its own explicit hidden:true or it'd
      // show up as an empty header.
      hidden: true,
      component: empty,
      meta: {
        title: i18n.t('Activity'),
        icon: 'accounts',
        permissions: []
      },
      children: activity
    }
  ]
}
