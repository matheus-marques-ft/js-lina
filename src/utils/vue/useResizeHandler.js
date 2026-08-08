import { onBeforeMount, onBeforeUnmount, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

const { body } = document
const WIDTH = 992 // refer to Bootstrap's responsive design

/**
 * useResizeHandler - a composable that handles responsive layout
 * Replaces the ResizeHandler mixin
 */
export function useResizeHandler() {
  const store = useStore()
  const router = useRouter()

  function isMobile() {
    const rect = body.getBoundingClientRect()
    return rect.width - 1 < WIDTH
  }

  function resizeHandler() {
    if (!document.hidden) {
      const mobile = isMobile()
      store.dispatch('app/toggleDevice', mobile ? 'mobile' : 'desktop')

      if (mobile) {
        store.dispatch('app/closeSideBar', { withoutAnimation: true })
      }
    }
  }

  // Watch for route changes, return the unregister function
  const unregisterRouterGuard = router.afterEach((to) => {
    if (store.state.app.device === 'mobile' && store.state.app.sidebar.opened) {
      store.dispatch('app/closeSideBar', { withoutAnimation: false })
    }
  })

  onBeforeMount(() => {
    window.addEventListener('resize', resizeHandler)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeHandler)
    // Clean up the router guard
    if (unregisterRouterGuard) {
      unregisterRouterGuard()
    }
  })

  onMounted(() => {
    const mobile = isMobile()
    if (mobile) {
      store.dispatch('app/toggleDevice', 'mobile')
      store.dispatch('app/closeSideBar', { withoutAnimation: true })
    }
  })

  return {
    isMobile,
    resizeHandler
  }
}

export default useResizeHandler
