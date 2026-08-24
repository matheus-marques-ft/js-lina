<template>
  <div :class="{ collapse: collapse }" class="sidebar-logo-container">
    <transition name="sidebarLogoFade">
      <a v-if="collapse" key="collapse" class="sidebar-logo-link" @click="handleClick">
        <img :src="logoSrc" alt="logo" class="sidebar-logo" />
      </a>
      <a v-else key="expand" class="sidebar-logo-link" @click="handleClick">
        <img :src="logoTextSrc" alt="logo" class="sidebar-logo-text" />
      </a>
    </transition>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { getFirstAccessibleChildPath } from '@/utils/vue'

export default {
  name: 'SidebarLogo',
  props: {
    collapse: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {}
  },
  computed: {
    ...mapGetters(['viewRoutes', 'publicSettings']),
    // eslint-disable-next-line vue/return-in-computed-property
    logoTextSrc() {
      return this.publicSettings['INTERFACE']['logo_index']
    },
    logoSrc() {
      return this.publicSettings['INTERFACE']['logo_logout']
    }
  },
  created() {},
  methods: {
    handleClick() {
      // Always go to the main (merged Console/PAM/Audit/Workbench) screen, regardless of
      // where we currently are - this is the app's "go home" action. Settings/Profile/
      // Tickets have no other way back to the main screen now that ViewSwitcher is gone.
      const mainRoute = this.viewRoutes.find((route) => route.name === 'MainMenu')

      if (mainRoute) {
        const redirect = mainRoute.redirect
        const rootPath = mainRoute.meta?.fullPath || mainRoute.path
        const redirectPath = typeof redirect === 'string' ? redirect : ''
        // mainRoute.children is already permission/hidden-filtered (filterHiddenRoutes), but
        // `redirect` itself is copied verbatim from the raw route config and never re-checked
        // against what actually survived filtering - so for a user without console access
        // (AdminDashboard is hidden when consoleOrgs is empty), pushing straight to `redirect`
        // silently resolves to no route at all. Verify it's still a real child first.
        const redirectStillAccessible = redirectPath
          ? (mainRoute.children || []).some(
              (child) => (child.meta?.fullPath || child.path) === redirectPath
            )
          : false
        const targetPath =
          (redirectStillAccessible && redirectPath) ||
          getFirstAccessibleChildPath(rootPath) ||
          (redirect && typeof redirect === 'object' ? redirect : '') ||
          rootPath
        this.$router.push(targetPath)
      } else {
        this.$router.push('/')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}

.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
}

.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: $headerHeight;
  line-height: $headerHeight;
  text-align: center;
  overflow: hidden;

  & .sidebar-logo-link {
    height: 100%;
    width: 100%;
    padding: 5px;
    display: inline-block;

    & .sidebar-logo {
      width: 32px;
      height: 32px;
      vertical-align: middle;
      margin-right: 0;
    }

    & .sidebar-logo-text {
      max-width: 100%;
      height: 20px;
      width: auto;
    }

    & .sidebar-title {
      display: inline-block;
      margin: 0;
      color: #fff;
      font-weight: 600;
      line-height: $headerHeight;
      font-size: 14px;
      font-family:
        Avenir,
        Helvetica Neue,
        Arial,
        Helvetica,
        sans-serif;
      vertical-align: middle;
    }
  }

  &.collapse {
    height: $headerHeight;
    line-height: $headerHeight;
    .sidebar-logo {
      margin-right: 0;
    }
  }
}
</style>
