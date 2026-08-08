import { onMounted } from 'vue'
import { useStore } from 'vuex'

/**
 * useFixIOSBug - a composable that fixes the menu-click bug on iOS devices
 * Replaces the FixiOSBug mixin
 *
 * @param {import('vue').Ref} subMenuRef - ref of the el-sub-menu component
 */
export function useFixIOSBug(subMenuRef) {
  const store = useStore()

  function fixBugIniOS() {
    const $subMenu = subMenuRef.value
    if ($subMenu) {
      const handleMouseleave = $subMenu.handleMouseleave
      $subMenu.handleMouseleave = (e) => {
        if (store.state.app.device === 'mobile') {
          return
        }
        handleMouseleave(e)
      }
    }
  }

  onMounted(() => {
    fixBugIniOS()
  })

  return {
    fixBugIniOS
  }
}

export default useFixIOSBug
