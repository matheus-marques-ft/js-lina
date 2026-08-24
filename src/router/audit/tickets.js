import i18n from '@/i18n/i18n'

// The "ticket-list" wrapper used to hold this as its only visible child, but that child
// itself had `children`, which blocks SidebarItem's single-child collapse (it only
// collapses when the sole visible child is a leaf) - it rendered as a group-title header
// with one nested link inside. Flattened here: the wrapper is gone, its permission
// (previously the actual gate - the leaf's own `permissions: []` never restricted access)
// is copied onto the leaf to preserve today's behavior exactly. Path kept as 'ticket-list'
// so `TicketRoutes` (the still-existing outer wrapper in audit/index.js) resolves the same
// fullPath as before.
export default [
  {
    path: 'ticket-list',
    name: 'AuditTicketList',
    component: () => import('@/views/audits/TicketList'),
    meta: {
      title: i18n.t('TicketList'),
      menuTitle: i18n.t('MenuTicketOrders'),
      icon: 'ticket-list',
      permissions: ['audits.view_joblog']
    }
  }
]
