import i18n from '@/i18n/i18n'

// The "services" wrapper used to hold these as its only visible child, but that child
// itself had its own `children`, which blocks SidebarItem's single-child collapse (it
// only collapses when the sole visible child is a leaf) - it rendered as a group-title
// header with one nested link inside. Flattened here: the wrapper is gone, its children
// (still full sub-trees themselves) are hoisted one level, paths preserved so
// `Integrations` (the still-existing outer wrapper in pam/index.js) resolves the exact
// same fullPath as before.
export default [
  {
    path: 'services',
    component: () => import('@/views/accounts/Integration/index.vue'),
    name: 'IntegrationApplicationList',
    meta: {
      title: i18n.t('Applications'),
      permissions: ['accounts.view_integrationapplication']
    }
  },
  {
    path: 'services/create',
    component: () => import('@/views/accounts/Integration/ApplicationCreateUpdate.vue'),
    name: 'IntegrationApplicationCreate',
    hidden: true,
    meta: {
      title: i18n.t('IntegrationApplicationCreate'),
      permissions: ['accounts.add_integrationapplication']
    }
  },
  {
    path: 'services/:id/update',
    component: () => import('@/views/accounts/Integration/ApplicationCreateUpdate.vue'),
    name: 'IntegrationApplicationUpdate',
    hidden: true,
    meta: {
      title: i18n.t('IntegrationApplicationUpdate'),
      permissions: ['accounts.change_integrationapplication']
    }
  },
  {
    path: 'services/:id',
    component: () => import('@/views/accounts/Integration/ApplicationDetail/index.vue'),
    name: 'IntegrationApplicationDetail',
    hidden: true,
    meta: {
      title: i18n.t('ApplicationDetail'),
      permissions: ['accounts.view_integrationapplication']
    }
  }
]
