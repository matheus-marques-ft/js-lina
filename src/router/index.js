import { createRouter, createWebHashHistory } from 'vue-router'
import Layout from '@/layout'
import i18n from '@/i18n/i18n'
/**
 * Note: sub-menu only appear when route children.length >= 1
 * Detail see: https://panjiachen.github.io/vue-element-admin-site/guide/essentials/router-and-nav.html
 *
 * hidden: true                   if set true, item will not show in the sidebar(default is false)
 * alwaysShow: true               if set true, will always show the root menu
 *                                if not set alwaysShow, when item has more than one children route,
 *                                it will becomes nested mode, otherwise not show the root menu
 * redirect: noRedirect           if set noRedirect will no redirect in the breadcrumb
 * name:'router-name'             the name is used by <keep-alive> (must set!!!)
 * meta : {
 roles: ['admin','editor']    control the page roles (you can set multiple roles)
 title: 'title'               the name show in sidebar and breadcrumb (recommend set)
 icon: 'svg-name'             the icon show in the sidebar
 breadcrumb: false            if set false, the item will hidden in breadcrumb(default is true)
 activeMenu: '/example/list'  if set path, the sidebar will highlight the path you set
 }
 */
import commonRoutes from './common'
/**
 * user routes
 * the routes that need to be dynamically loaded based on user roles
 */
// Permission-gated routes
import mainViewRoutes from './main'
import ticketsRoutes from './tickets'
import settingsRoutes from './settings'
import profileRoutes from './profile'
import reportsViewRoutes from './reports'
import { getPropView } from '@/utils/jms/index'
import store from '@/store'

/**
 * constantRoutes
 * a base page that does not have permission requirements
 * all roles can be accessed
 */
// Global routes
export const constantRoutes = [
  {
    path: '/',
    component: Layout,
    // Always land on the workbench overview after login, per explicit user request - was
    // '/console' before. Note this static redirect is resolved before vue-router ever
    // descends into the child route below, so that child's own beforeEnter/getPropView
    // fallback (kept for '' being directly deep-linked) never actually runs for bare '/'.
    redirect: '/workbench/home',
    meta: {
      type: 'view',
      view: 'home',
      title: i18n.global.t('Index')
    },
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/workbench/overview/index'),
        meta: {
          icon: 'dashboard',
          title: i18n.global.t('Overview')
        },
        beforeEnter: async () => {
          const preferView = getPropView()
          if (preferView) {
            await store.dispatch('app/reset')
            return `/${preferView}`
          }
          return true
        }
      }
    ]
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/404'),
    hidden: true
  },
  ...commonRoutes
]

/**
 * admin
 * the routes that need to be dynamically loaded based on admin roles
 */
export const viewRoutes = [
  mainViewRoutes,
  ticketsRoutes,
  settingsRoutes,
  profileRoutes,
  reportsViewRoutes
]

const createRouterInstance = () =>
  createRouter({
    // mode: 'history', // require service support
    scrollBehavior: () => ({ top: 0 }),
    history: createWebHashHistory('/ui/'),
    routes: constantRoutes
  })

const router = createRouterInstance()
const dynamicRouteRemovers = []

export function addDynamicRoute(route) {
  const removeRoute = router.addRoute(route)
  dynamicRouteRemovers.push(removeRoute)
}

export function resetRouter() {
  dynamicRouteRemovers.splice(0).forEach((removeRoute) => removeRoute())
}

export default router
