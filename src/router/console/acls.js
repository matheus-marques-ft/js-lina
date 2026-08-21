import i18n from '@/i18n/i18n'
import empty from '@/layout/empty'

const globalSubmenu = () => import('@/layout/globalOrg.vue')

// Moved in from perms.js: user asked for "Permissões de acesso" to live inside "Controle
// de acesso" instead of as its own sibling entry. Path stays absolute/unchanged -
// PermUser.vue:217 hard-codes a match on '/console/perms/asset-permissions/' regardless of
// where this sits in the menu tree.
export const AssetPermissionsRoute = {
  path: '/console/perms/asset-permissions',
  name: 'AssetPermissions',
  component: empty,
  redirect: {
    name: 'AssetPermissionList'
  },
  meta: {
    title: i18n.t('BaseAssetPermission'),
    resource: 'assetpermission',
    icon: 'permission'
  },
  children: [
    {
      path: '',
      name: 'AssetPermissionList',
      component: () => import('@/views/perms/AssetPermission/AssetPermissionList'),
      meta: {
        title: i18n.t('Permissões de acesso'),
        permissions: ['perms.view_assetpermission']
      }
    },
    {
      path: 'create',
      component: () => import('@/views/perms/AssetPermission/AssetPermissionCreateUpdate'),
      name: 'AssetPermissionCreate',
      hidden: true,
      meta: {
        title: i18n.t('AssetPermissionCreate'),
        action: 'create',
        permissions: ['perms.add_assetpermission']
      }
    },
    {
      path: ':id/update',
      component: () => import('@/views/perms/AssetPermission/AssetPermissionCreateUpdate.vue'),
      name: 'AssetPermissionUpdate',
      hidden: true,
      meta: {
        title: i18n.t('AssetPermissionUpdate'),
        action: 'update',
        permissions: ['perms.change_assetpermission']
      }
    },
    {
      path: ':id',
      component: () => import('@/views/perms/AssetPermission/AssetPermissionDetail/index.vue'),
      name: 'AssetPermissionDetail',
      hidden: true,
      meta: {
        title: i18n.t('AssetPermissionDetail'),
        permissions: ['perms.view_assetpermission']
      }
    }
  ]
}

// Promoted to its own top-level "Filtragem de comandos" entry in console/index.js instead
// of living nested inside the ACLs bucket alongside 5 unrelated ACL types - exported
// separately so it can be spread in there.
export const CmdAclsRoute = {
  path: 'cmd-acls',
  component: empty,
  redirect: {
    name: 'CommandFilterACLList'
  },
  name: 'CmdACL',
  meta: {
    title: i18n.t('CommandFilterACLs'),
    menuTitle: i18n.t('CommandFilter'),
    icon: 'command',
    app: 'acls',
    resource: 'commandfilteracl'
  },
  children: [
    // Command Filter ACL
    {
      path: '',
      name: 'CommandFilterACLList',
      component: () => import('@/views/acls/CommandFilterACL/index'),
      // Must stay visible: with every child of CmdAclsRoute hidden, SidebarItem's
      // hasOneShowingChild() falls into its zero-visible-children branch, which
      // synthesizes onlyOneChild as a copy of the PARENT wrapper (level 2, with its own
      // `children` truthy) - that combination trips getItemTitle()'s uppercase rule
      // (meant for un-collapsed level-2 group headers), rendering "FILTRAGEM DE COMANDO"
      // in caps with no icon instead of collapsing to this leaf's own title/icon.
      // permissions is explicit because this node is level 3: cleanRoute() only inherits
      // the parent's resource for level 4+ nodes, so without this it recalculates from
      // its own (empty) path and produces an unmatchable permission, hiding the item.
      meta: {
        title: i18n.tc('CommandFilterACL', 2),
        menuTitle: i18n.t('CommandFilter'),
        activeMenu: '',
        permissions: ['acls.view_commandfilteracl']
      }
    },
    {
      path: 'create',
      name: 'CommandFilterACLCreate',
      component: () =>
        import('@/views/acls/CommandFilterACL/CommandFilterAcl/CommandFilterAclCreateUpdate'),
      hidden: true,
      meta: { title: i18n.t('CommandFilterACLCreate'), activeMenu: '' }
    },
    {
      path: ':id',
      name: 'CommandFilterACLDetail',
      component: () =>
        import('@/views/acls/CommandFilterACL/CommandFilterAcl/CommandFilterAclDetail/index'),
      hidden: true,
      meta: {
        title: i18n.t('CommandFilterACLDetail'),
        activeMenu: ''
      }
    },
    {
      path: ':id/update',
      name: 'CommandFilterACLUpdate',
      component: () =>
        import('@/views/acls/CommandFilterACL/CommandFilterAcl/CommandFilterAclCreateUpdate'),
      hidden: true,
      meta: { title: i18n.t('CommandFilterACLUpdate'), activeMenu: '' }
    }
  ]
}

export default [
  {
    path: 'acls',
    name: 'ACLList',
    component: empty,
    // Hidden per user request: all 5 of its visible children (login-acls,
    // login-asset-acls, data-masking-rules, clipboard-acls, connect-method-acls) require
    // `licenseRequired: true`, which this deployment doesn't have - it currently has
    // nothing to show. Re-enable when those enterprise ACL types (or the license) are
    // available.
    hidden: false,
    // Was a bare relative string ('login-acls') - that resolved fine while this node's own
    // path was still relative (nested under Perms), but broke once the Fase 3.5 promotion
    // made this node's path absolute (a direct console child): Vue Router resolves a
    // non-'/' redirect string against the PARENT route's path, not this route's own, so it
    // was landing on '/console/login-acls' instead of '/console/perms/acls/login-acls'.
    // Name-based redirect sidesteps path nesting entirely - same pattern already used by
    // every sibling wrapper in this codebase (Account, ConsoleLabels, AccountTemplate...).
    redirect: { name: 'UserLoginACLList' },
    meta: {
      title: i18n.t('ACLs'),
      icon: 'acl',
      permissions: []
    },
    children: [
      AssetPermissionsRoute,
      {
        path: 'login-acls',
        component: globalSubmenu,
        redirect: {
          name: 'UserLoginACLList'
        },
        meta: {
          title: i18n.t('UserLoginACLs'),
          icon: 'login',
          app: 'acls',
          resource: 'loginacl',
          disableOrgsChange: true,
          licenseRequired: false
        },
        children: [
          {
            path: '',
            name: 'UserLoginACLList',
            component: () => import('@/views/acls/UserLoginACL/UserLoginACLList.vue'),
            meta: {
              title: i18n.t('UserLoginACLs'),
              menuTitle: i18n.t('UserLogin'),
              activeMenu: ''
            }
          },
          {
            path: 'create',
            name: 'UserLoginACLCreate',
            component: () => import('@/views/acls/UserLoginACL/UserLoginACLCreateUpdate.vue'),
            hidden: true,
            meta: {
              title: i18n.t('UserLoginACLCreate'),
              activeMenu: ''
            }
          },
          {
            path: ':id',
            name: 'UserLoginACLDetail',
            component: () => import('@/views/acls/UserLoginACL/UserDetail/index'),
            hidden: true,
            meta: {
              title: i18n.t('UserLoginACLDetail'),
              activeMenu: '',
              app: 'acls',
              resource: 'loginacl'
            }
          },
          {
            path: ':id/update',
            name: 'UserLoginACLUpdate',
            component: () => import('@/views/acls/UserLoginACL/UserLoginACLCreateUpdate.vue'),
            hidden: true,
            meta: { title: i18n.t('UserLoginACLUpdate'), activeMenu: '' }
          }
        ]
      },
      {
        path: 'login-asset-acls',
        component: empty,
        redirect: {
          name: 'AssetACLList'
        },
        name: 'LoginAssetACLs',
        meta: {
          title: i18n.t('BaseAssetACLs'),
          icon: 'connect',
          licenseRequired: false,
          app: 'acls',
          resource: 'loginassetacl'
        },
        children: [
          {
            path: '',
            name: 'AssetACLList',
            component: () => import('@/views/acls/AssetLoginACL/AssetLoginAclList.vue'),
            meta: {
              title: i18n.t('AssetACLs'),
              activeMenu: '',
              menuTitle: i18n.t('AssetConnect')
            }
          },
          {
            path: 'create',
            name: 'AssetACLCreate',
            component: () => import('@/views/acls/AssetLoginACL/AssetLoginAclCreateUpdate.vue'),
            hidden: true,
            meta: { title: i18n.t('AssetACLCreate'), activeMenu: '' }
          },
          {
            path: ':id',
            name: 'AssetACLDetail',
            component: () => import('@/views/acls/AssetLoginACL/AssetLoginAclDetail/index'),
            hidden: true,
            meta: { title: i18n.t('AssetACLDetail'), activeMenu: '' }
          },
          {
            path: ':id/update',
            name: 'AssetACLUpdate',
            component: () => import('@/views/acls/AssetLoginACL/AssetLoginAclCreateUpdate.vue'),
            hidden: true,
            meta: { title: i18n.t('AssetACLUpdate'), activeMenu: '' }
          }
        ]
      },
      {
        path: 'data-masking-rules',
        component: empty,
        redirect: {
          name: 'DataMaskingRuleList'
        },
        name: 'DataMaskingRules',
        meta: {
          title: i18n.t('DataMasking'),
          icon: 'eye',
          licenseRequired: false,
          app: 'acls',
          resource: 'datamaskingrule'
        },
        children: [
          {
            path: '',
            name: 'DataMaskingRuleList',
            component: () => import('@/views/acls/DataMaskingRule/DataMaskingRuleList.vue'),
            meta: {
              title: i18n.t('DataMasking'),
              activeMenu: '',
              menuTitle: i18n.t('DataMasking')
            }
          },
          {
            path: 'create',
            name: 'DataMaskingRuleCreate',
            component: () => import('@/views/acls/DataMaskingRule/DataMaskingRuleCreateUpdate.vue'),
            hidden: true,
            meta: { title: '', activeMenu: '' }
          },
          {
            path: ':id',
            name: 'DataMaskingRuleDetail',
            component: () => import('@/views/acls/DataMaskingRule/DataMaskingRuleDetail/index'),
            hidden: true,
            meta: { title: i18n.t('AssetACLDetail'), activeMenu: '' }
          },
          {
            path: ':id/update',
            name: 'DataMaskingRuleUpdate',
            component: () => import('@/views/acls/DataMaskingRule/DataMaskingRuleCreateUpdate.vue'),
            hidden: true,
            meta: { title: '', activeMenu: '' }
          }
        ]
      },
      {
        path: 'clipboard-acls',
        component: empty,
        redirect: {
          name: 'ClipboardACLList'
        },
        name: 'ClipboardACLs',
        meta: {
          title: i18n.t('ClipboardACLs'),
          icon: 'copy',
          licenseRequired: false,
          app: 'acls',
          resource: 'clipboardacl'
        },
        children: [
          {
            path: '',
            name: 'ClipboardACLList',
            component: () => import('@/views/acls/ClipboardACL/ClipboardAclList.vue'),
            meta: {
              title: i18n.t('ClipboardACLs'),
              activeMenu: '',
              menuTitle: i18n.t('Clipboard')
            }
          },
          {
            path: 'create',
            name: 'ClipboardACLCreate',
            component: () => import('@/views/acls/ClipboardACL/ClipboardAclCreateUpdate.vue'),
            hidden: true,
            meta: { title: i18n.t('ClipboardACLCreate'), activeMenu: '' }
          },
          {
            path: ':id',
            name: 'ClipboardACLDetail',
            component: () => import('@/views/acls/ClipboardACL/ClipboardAclDetail/index'),
            hidden: true,
            meta: { title: i18n.t('ClipboardACLDetail'), activeMenu: '' }
          },
          {
            path: ':id/update',
            name: 'ClipboardACLUpdate',
            component: () => import('@/views/acls/ClipboardACL/ClipboardAclCreateUpdate.vue'),
            hidden: true,
            meta: { title: i18n.t('ClipboardACLUpdate'), activeMenu: '' }
          }
        ]
      },
      {
        path: 'cmd-groups',
        component: empty,
        redirect: {
          name: 'CommandGroupList'
        },
        name: 'CmdGroups',
        hidden: true,
        meta: {
          app: 'acls',
          resource: 'commandgroup',
          activeMenu: ''
        },
        children: [
          // Command Group
          {
            path: '',
            name: 'CommandGroupList',
            component: () => import('@/views/acls/CommandFilterACL/index'),
            hidden: true,
            meta: {
              title: i18n.t('CommandGroupList'),
              activeMenu: ''
            }
          },
          {
            path: 'create',
            name: 'CommandGroupCreate',
            component: () =>
              import('@/views/acls/CommandFilterACL/CommandGroup/CommandGroupCreateUpdate'),
            hidden: true,
            meta: {
              title: i18n.t('CommandGroupCreate'),
              activeMenu: ''
            }
          },
          {
            path: ':id',
            name: 'CommandGroupDetail',
            component: () =>
              import('@/views/acls/CommandFilterACL/CommandGroup/CommandGroupDetail/index'),
            hidden: true,
            meta: {
              title: i18n.t('CommandGroupDetail'),
              activeMenu: '/console/cmd-acls'
            }
          },
          {
            path: ':id/update',
            name: 'CommandGroupUpdate',
            component: () =>
              import('@/views/acls/CommandFilterACL/CommandGroup/CommandGroupCreateUpdate'),
            hidden: true,
            meta: {
              title: i18n.t('CommandGroupUpdate'),
              activeMenu: ''
            }
          }
        ]
      },
      {
        path: 'connect-method-acls',
        component: globalSubmenu,
        redirect: {
          name: 'ConnectMethodACLList'
        },
        name: 'ConnectMethodACL',
        meta: {
          title: i18n.t('ConnectMethodList'),
          icon: 'link',
          licenseRequired: false,
          app: 'acls',
          disableOrgsChange: true,
          resource: 'connectmethodacl'
        },
        children: [
          {
            path: '',
            name: 'ConnectMethodACLList',
            component: () => import('@/views/acls/ConnectMethodACL/ConnectMethodAclList.vue'),
            meta: {
              title: i18n.t('ConnectMethodACLs'),
              activeMenu: '',
              menuTitle: i18n.t('ConnectMethod')
            }
          },
          {
            path: 'create',
            name: 'ConnectMethodACLCreate',
            component: () =>
              import('@/views/acls/ConnectMethodACL/ConnectMethodAclCreateUpdate.vue'),
            hidden: true,
            meta: { title: i18n.t('ConnectMethodAclCreate'), activeMenu: '' }
          },
          {
            path: ':id',
            name: 'ConnectMethodACLDetail',
            component: () => import('@/views/acls/ConnectMethodACL/ConnectMethodAclDetail/index'),
            hidden: true,
            meta: { title: i18n.t('ConnectMethodAclDetail'), activeMenu: '' }
          },
          {
            path: ':id/update',
            name: 'ConnectMethodACLUpdate',
            component: () =>
              import('@/views/acls/ConnectMethodACL/ConnectMethodAclCreateUpdate.vue'),
            hidden: true,
            meta: { title: i18n.t('ConnectMethodAclUpdate'), activeMenu: '' }
          }
        ]
      }
    ]
  }
]
