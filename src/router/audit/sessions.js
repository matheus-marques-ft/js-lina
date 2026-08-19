import i18n from '@/i18n/i18n'
import empty from '@/layout/empty'

// Promoted to a direct top-level entry in audit/index.js (the old "/audit/sessions"
// wrapper that only existed to hold this + Commands + FtpLog + OnlineSession is gone -
// Commands is now a tab inside SessionList itself, and OnlineSession moved into the new
// "Logs de usuários" composite page).
export const SessionsRoute = {
  path: 'sessions',
  redirect: {
    name: 'SessionList'
  },
  component: empty,
  meta: {
    // Renamed from "Registro de sessão"/"Sessions".
    title: i18n.t('Logs de sessão'),
    app: 'terminal',
    resource: 'session',
    expanded: true,
    icon: 'session',
    permissions: ['terminal.view_session']
  },
  children: [
    {
      path: '',
      name: 'SessionList',
      component: () => import('@/views/sessions/SessionList'),
      meta: {
        title: i18n.t('Logs de sessão'),
        permissions: ['terminal.view_session']
      }
    },
    {
      path: ':id',
      name: 'SessionDetail',
      component: () => import('@/views/sessions/SessionDetail'),
      hidden: true,
      meta: { title: i18n.t('SessionDetail') }
    }
  ]
}

export const FtpLogRoute = {
  path: 'ftp',
  name: 'FtpLog',
  component: () => import('@/views/sessions/FTPLogList'),
  meta: {
    title: i18n.t('FileTransfer'),
    icon: 'file-transfer',
    permissions: ['audits.view_ftplog']
  }
}
