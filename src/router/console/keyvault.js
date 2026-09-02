import i18n from '@/i18n/i18n'
import empty from '@/layout/empty'

export default [
  {
    path: 'secrets',
    component: empty,
    name: 'Secret',
    redirect: {
      name: 'SecretList'
    },
    meta: {
      title: i18n.t('Secrets'),
      icon: 'key',
      app: 'keyvault'
      // No menuGroup override, unlike labels.js/acls.js - stays a direct Management entry,
      // same as AccountTemplate/Account (console/accounts.js).
    },
    children: [
      {
        path: '',
        component: () => import('@/views/keyvault/Secret/SecretList.vue'),
        name: 'SecretList',
        // menuTitle wins for the sidebar label once this collapses to a single flat link.
        // permissions is explicit because this node is level 3: cleanRoute() only inherits
        // the parent's resource for level 4+ nodes, so without this it recalculates from
        // its own (empty) path and produces an unmatchable permission, hiding the item -
        // see labels.js's LabelList for the same note.
        meta: {
          title: i18n.t('SecretList'),
          menuTitle: i18n.t('Secrets'),
          permissions: ['keyvault.view_secret']
        }
      },
      {
        path: 'create',
        name: 'SecretCreate',
        component: () => import('@/views/keyvault/Secret/SecretCreateUpdate.vue'),
        hidden: true,
        meta: { title: i18n.t('SecretCreate'), permissions: ['keyvault.add_secret'] }
      },
      {
        path: ':id/update',
        name: 'SecretUpdate',
        component: () => import('@/views/keyvault/Secret/SecretCreateUpdate.vue'),
        hidden: true,
        meta: { title: i18n.t('SecretUpdate'), permissions: ['keyvault.change_secret'] }
      }
    ]
  }
]
