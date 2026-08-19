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
        title: i18n.t('Logs de usuários'),
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
    {
      path: '/audit/jobs',
      component: empty,
      redirect: '',
      name: 'AuditsJobs',
      meta: {
        title: i18n.t('JobsAudit'),
        icon: 'job',
        permissions: ['audits.view_joblog']
      },
      children: JobRoutes
    },
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
        licenseRequired: true
      },
      children: ReportsRoutes
    }
  ]
}
