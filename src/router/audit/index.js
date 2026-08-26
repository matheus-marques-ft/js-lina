import Layout from '@/layout'
import i18n from '@/i18n/i18n'

import { SessionsRoute, FtpLogRoute } from './sessions'
import LogRoutes from './audits'
import JobRoutes from './jobs'
import ReportsRoutes from './reports'
import TicketRoutes from './tickets'
import empty from '@/layout/empty'
import store from '@/store'

export default {
  path: '/audit/',
  name: 'audit',
  component: Layout,
  redirect: '/audit/dashboard',
  meta: {
    title: i18n.t('Audits'),
    icon: 'audit',
    showNavSwitcher: () => {
      return store.getters.auditOrgs.length > 0
    },
    permissions: [],
    view: 'audit'
  },
  children: [
    {
      path: '/audit/dashboard',
      component: () => import('@/views/dashboard/Audit/index'),
      name: 'AuditDashboard',
      // permissions: [] never restricts (see checkPermission), so this always survived
      // filterPermedRoutes regardless of role - a user with zero real Audit access still
      // got an "AUDITORIA" category header with only this item inside. Hidden instead
      // whenever the user has no org where they hold rbac.view_audit (same signal already
      // used for showNavSwitcher above) - when this is the only surviving item, the whole
      // category disappears too via groupedSidebarItems' existing empty-category filter.
      hidden: () => store.getters.auditOrgs.length === 0,
      meta: {
        icon: 'dashboard',
        title: i18n.t('Dashboard'),
        permissions: []
      }
    },
    {
      ...SessionsRoute,
      path: '/audit/sessions'
    },
    {
      ...FtpLogRoute,
      path: '/audit/ftp'
    },
    {
      path: '/audit/user-logs',
      component: () => import('@/views/audits/UserLogs/index.vue'),
      name: 'AuditUserLogs',
      meta: {
        title: i18n.t('MenuUserLogs'),
        icon: 'user-o',
        permissions: [
          'audits.view_usersession | audits.view_userloginlog | ' +
            'audits.view_passwordchangelog | audits.view_operatelog'
        ]
      }
    },
    {
      // No longer a visible menu entry (its 3 resources are now tabs inside the "Logs de
      // usuários" page above) - kept registered and hidden as a zero-cost safety net.
      path: '/audit/audits',
      component: empty,
      redirect: '',
      name: 'Audits',
      hidden: true,
      meta: {
        title: i18n.t('LogsAudit'),
        icon: 'log',
        permissions: []
      },
      children: LogRoutes
    },
    // "AUDITORIA DE TAREFAS" wrapper removed - it held 2 visible children, so it always
    // rendered as a group-title header. Its children are hoisted directly here (fullPath
    // preserved via absolute path override) - each already carries its own permission
    // gate (audits.view_joblog), so removing the wrapper doesn't loosen access.
    ...JobRoutes.map((route) => ({ ...route, path: `/audit/jobs/${route.path}` })),
    {
      path: '/audit/tickets',
      component: empty,
      redirect: '',
      name: 'TicketRoutes',
      meta: {
        title: i18n.t('TicketsAudit'),
        icon: 'job',
        permissions: ['tickets.view_ticket']
      },
      children: TicketRoutes
    },
    {
      path: '/audit/reports',
      component: empty,
      redirect: '',
      name: 'AuditsReports',
      meta: {
        title: i18n.t('Report'),
        icon: 'report',
        permissions: [],
        licenseRequired: false,
        // Promotes this from a group nested inside "Audit" to its own top-level sidebar
        // category, sibling to Management/CONTROLE DE ACESSO/PAM/Audit - see NavLeft/
        // index.vue's CATEGORY_ORDER/CATEGORY_I18N_KEYS ('reports' reuses this same
        // 'Report' i18n key).
        menuGroup: 'reports'
      },
      // ReportsRoutes is this directory's own ./reports.js (audit/reports.js), an array of
      // 3 route wrappers (users/assets/accounts) - NOT src/router/reports/index.js (an
      // unrelated, unused module one level up with a completely different Dashboard/Users/
      // Assets/Accounts shape). A previous fix here appended `.children`, assuming the
      // wrong module's shape; since this ReportsRoutes is already the array to use, that
      // read `.children` off a plain array (always undefined), silently dropping every
      // report page - this is why "Relatório" always collapsed to a single dead link.
      children: ReportsRoutes
    }
  ]
}
