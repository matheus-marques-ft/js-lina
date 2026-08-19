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
    {
      path: '/pam/automations',
      name: 'AccountAutomation',
      component: empty,
      meta: {
        title: i18n.tc('Automation'),
        icon: 'accounts',
        permissions: []
      },
      children: automations
    },
    {
      path: '/pam/security',
      name: 'AccountSecurity',
      component: empty,
      meta: {
        title: i18n.t('Security'),
        icon: 'accounts',
        permissions: []
      },
      children: security
    },
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
