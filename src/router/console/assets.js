import i18n from '@/i18n/i18n'
import empty from '@/layout/empty'
import XPackRoutes from './xpack'

// Promoted to its own top-level "Domínios" entry in console/index.js instead of living
// nested inside the Assets group - exported separately so it can be spread in there.
export const ZonesRoute = {
  path: 'zones',
  component: empty,
  redirect: '',
  meta: {
    resource: 'zone',
    icon: 'zone',
    permissions: ['assets.view_zone']
  },
  children: [
    {
      path: '',
      name: 'ZoneList',
      component: () => import('@/views/assets/Zone/ZoneList.vue'),
      // menuTitle wins for the sidebar label once this collapses to a single flat link
      // (its only visible child) - keeps the page's own title ("ZoneList") intact.
      // permissions is explicit because this node is level 3: cleanRoute() only inherits
      // the parent's resource for level 4+ nodes, so without this it recalculates from
      // its own (empty) path and produces an unmatchable permission, hiding the item.
      meta: {
        title: i18n.t('ZoneList'),
        menuTitle: i18n.t('Domínios'),
        permissions: ['assets.view_zone']
      }
    },
    {
      path: 'create',
      name: 'ZoneCreate',
      component: () => import('@/views/assets/Zone/ZoneCreateUpdate.vue'),
      hidden: true,
      meta: { title: i18n.t('ZoneCreate') }
    },
    {
      path: ':id/update',
      name: 'ZoneUpdate',
      component: () => import('@/views/assets/Zone/ZoneCreateUpdate.vue'),
      hidden: true,
      meta: { title: i18n.t('ZoneUpdate') }
    },
    {
      path: ':id',
      name: 'ZoneDetail',
      component: () => import('@/views/assets/Zone/ZoneDetail'),
      hidden: true,
      meta: { title: i18n.t('Zone') }
    }
  ]
}

// The "assets" wrapper used to hold these as its only visible child (AssetList), but that
// child itself had `children` (AssetDetail/AssetMoreInformationEdit), which blocks
// SidebarItem's single-child collapse (it only collapses when the sole visible child is a
// leaf) - it rendered as a group-title header ("GESTÃO DE ATIVOS") with one nested link
// inside. Flattened here: the wrapper is gone, paths prefixed with 'assets/' so the
// resulting fullPath is unchanged (still /console/assets/assets*) - this is mandatory,
// since ~14 activeMenu references elsewhere in this file (plus xpack.js's
// setChildrenActiveMenu call) hard-code '/console/assets/assets'. permissions is explicit
// on each leaf because they move from level 4 to level 3, where cleanRoute() recalculates
// permissions from each node's own path instead of inheriting the old wrapper's resource.
export default [
  {
    path: 'assets',
    name: 'AssetList',
    component: () => import('@/views/assets/Asset/AssetList/index.vue'),
    meta: {
      title: i18n.t('AssetList'),
      showInSearch: true,
      permissions: ['assets.view_asset']
    }
  },
  {
    path: 'assets/:id',
    name: 'AssetDetail',
    component: () => import('@/views/assets/Asset/AssetDetail'),
    hidden: true,
    meta: { title: i18n.t('AssetDetail'), permissions: ['assets.view_asset'] }
  },
  {
    path: 'assets/detail/:id/update',
    name: 'AssetMoreInformationEdit',
    component: () => import('@/views/assets/Asset/AssetMoreInformationEdit.vue'),
    hidden: true,
    meta: {
      title: i18n.t('UpdateAssetDetail'),
      action: 'update',
      permissions: ['assets.change_asset']
    }
  },
  {
    path: 'hosts',
    component: empty,
    redirect: '',
    hidden: true,
    meta: {
      title: i18n.t('HostList'),
      app: 'assets',
      resource: 'asset'
    },
    children: [
      {
        path: 'create',
        name: 'HostCreate',
        component: () => import('@/views/assets/Asset/AssetCreateUpdate/HostCreateUpdate.vue'),
        hidden: true,
        meta: { title: i18n.t('HostCreate'), activeMenu: '/console/assets/assets' }
      },
      {
        path: ':id/update',
        name: 'HostUpdate',
        component: () => import('@/views/assets/Asset/AssetCreateUpdate/HostCreateUpdate.vue'),
        hidden: true,
        meta: { title: i18n.t('HostUpdate'), activeMenu: '/console/assets/assets' }
      }
    ]
  },
  {
    path: 'databases',
    component: empty,
    redirect: '',
    hidden: true,
    meta: {
      title: i18n.t('Databases'),
      app: 'assets',
      resource: 'asset'
    },
    children: [
      {
        path: 'create',
        name: 'DatabaseCreate',
        component: () => import('@/views/assets/Asset/AssetCreateUpdate/DatabaseCreateUpdate.vue'),
        hidden: true,
        meta: { title: i18n.t('DatabaseCreate'), activeMenu: '/console/assets/assets' }
      },
      {
        path: ':id/update',
        name: 'DatabaseUpdate',
        component: () => import('@/views/assets/Asset/AssetCreateUpdate/DatabaseCreateUpdate.vue'),
        hidden: true,
        meta: { title: i18n.t('DatabaseUpdate'), activeMenu: '/console/assets/assets' }
      }
    ]
  },
  {
    path: 'devices',
    component: empty,
    redirect: '',
    hidden: true,
    meta: {
      title: i18n.t('devices'),
      app: 'assets',
      resource: 'asset'
    },
    children: [
      {
        path: 'create',
        name: 'DeviceCreate',
        component: () => import('@/views/assets/Asset/AssetCreateUpdate/DeviceCreateUpdate.vue'),
        hidden: true,
        meta: { title: i18n.t('DeviceCreate'), activeMenu: '/console/assets/assets' }
      },
      {
        path: ':id/update',
        name: 'DeviceUpdate',
        component: () => import('@/views/assets/Asset/AssetCreateUpdate/DeviceCreateUpdate.vue'),
        hidden: true,
        meta: { title: i18n.t('DeviceUpdate'), activeMenu: '/console/assets/assets' }
      }
    ]
  },
  {
    path: 'clouds',
    component: empty,
    redirect: '',
    hidden: true,
    meta: {
      app: 'assets',
      resource: 'asset'
    },
    children: [
      {
        path: 'create',
        name: 'CloudCreate',
        component: () => import('@/views/assets/Asset/AssetCreateUpdate/CloudCreateUpdate.vue'),
        hidden: true,
        meta: { title: i18n.t('CloudCreate'), activeMenu: '/console/assets/assets' }
      },
      {
        path: ':id/update',
        name: 'CloudUpdate',
        component: () => import('@/views/assets/Asset/AssetCreateUpdate/CloudCreateUpdate.vue'),
        hidden: true,
        meta: { title: i18n.t('CloudUpdate'), activeMenu: '/console/assets/assets' }
      }
    ]
  },
  {
    path: 'webs',
    component: empty,
    redirect: '',
    hidden: true,
    meta: {
      app: 'assets',
      resource: 'asset'
    },
    children: [
      {
        path: 'create',
        name: 'WebCreate',
        component: () => import('@/views/assets/Asset/AssetCreateUpdate/WebCreateUpdate.vue'),
        hidden: true,
        meta: { title: i18n.t('WebCreate'), activeMenu: '/console/assets/assets' }
      },
      {
        path: ':id/update',
        name: 'WebUpdate',
        component: () => import('@/views/assets/Asset/AssetCreateUpdate/WebCreateUpdate.vue'),
        hidden: true,
        meta: { title: i18n.t('WebUpdate'), activeMenu: '/console/assets/assets' }
      }
    ]
  },
  {
    path: 'gpts',
    component: empty,
    redirect: '',
    hidden: true,
    meta: {
      title: i18n.t('gpts'),
      app: 'assets',
      resource: 'asset'
    },
    children: [
      {
        path: 'create',
        name: 'GptCreate',
        component: () => import('@/views/assets/Asset/AssetCreateUpdate/GPTCreateUpdate.vue'),
        meta: { title: i18n.t('GPTCreate'), activeMenu: '/console/assets/assets' }
      },
      {
        path: ':id/update',
        name: 'GptUpdate',
        component: () => import('@/views/assets/Asset/AssetCreateUpdate/GPTCreateUpdate.vue'),
        meta: { title: i18n.t('GPTUpdate'), activeMenu: '/console/assets/assets' }
      }
    ]
  },
  {
    path: 'customs',
    component: empty,
    redirect: '',
    hidden: true,
    meta: {
      title: i18n.t('CustomAsset'),
      app: 'assets',
      resource: 'asset'
    },
    children: [
      {
        path: 'create',
        name: 'CustomCreate',
        component: () => import('@/views/assets/Asset/AssetCreateUpdate/CustomCreateUpdate.vue'),
        hidden: true,
        meta: { title: i18n.t('CustomCreate'), activeMenu: '/console/assets/assets' }
      },
      {
        path: ':id/update',
        name: 'CustomUpdate',
        component: () => import('@/views/assets/Asset/AssetCreateUpdate/CustomCreateUpdate.vue'),
        hidden: true,
        meta: { title: i18n.t('CustomUpdate'), activeMenu: '/console/assets/assets' }
      }
    ]
  },
  {
    path: 'gateways',
    component: empty,
    redirect: 'create',
    hidden: true,
    meta: {
      permissions: ['assets.view_gateway']
    },
    children: [
      {
        path: 'create',
        name: 'GatewayCreate',
        component: () => import('@/views/assets/Zone/ZoneDetail/GatewayCreateUpdate.vue'),
        meta: {
          title: i18n.t('GatewayCreate'),
          permissions: ['assets.view_gateway']
        }
      },
      {
        path: ':id/update',
        name: 'GatewayUpdate',
        component: () => import('@/views/assets/Zone/ZoneDetail/GatewayCreateUpdate.vue'),
        meta: {
          title: i18n.t('GatewayUpdate'),
          permissions: ['assets.change_gateway']
        }
      }
    ]
  },

  ...XPackRoutes
]
