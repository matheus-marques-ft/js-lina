import i18n from '@/i18n/i18n'
import empty from '@/layout/empty'

export default [
  {
    path: 'labels',
    component: empty,
    name: 'ConsoleLabels',
    redirect: {
      name: 'LabelList'
    },
    meta: {
      title: i18n.t('Tags'),
      icon: 'tag',
      app: 'labels'
    },
    children: [
      {
        path: '',
        component: () => import('@/views/labels/LabelList.vue'),
        name: 'LabelList',
        // menuTitle wins for the sidebar label once this collapses to a single flat link
        // (its only visible child), now that it's a direct top-level entry.
        // permissions is explicit because this node is level 3: cleanRoute() only
        // inherits the parent's resource for level 4+ nodes, so without this it
        // recalculates from its own (empty) path and produces an unmatchable
        // permission, hiding the item.
        meta: {
          title: i18n.t('TagList'),
          menuTitle: i18n.t('Tags'),
          permissions: ['labels.view_label']
        }
      },
      {
        path: 'create',
        name: 'LabelCreate',
        component: () => import('@/views/labels/LabelCreateUpdate.vue'),
        hidden: true,
        meta: { title: i18n.t('TagCreate') }
      },
      {
        path: ':id/update',
        name: 'LabelUpdate',
        component: () => import('@/views/labels/LabelCreateUpdate.vue'),
        hidden: true,
        meta: { title: i18n.t('TagUpdate') }
      }
    ]
  }
]
