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
    ...mapGetters(['publicSettings']),
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
      // Always go to the workbench home, regardless of where we currently are - this is the
      // app's "go home" action. Pushing '/' and relying on its static `redirect:
      // '/workbench/home'` (constantRoutes[0] in router/index.js) still landed on
      // '/console/dashboard' in practice - some guard in the merged Console/PAM/Audit/
      // Workbench screen (src/router/main.js) intercepts that intermediate '/' navigation
      // before the redirect resolves. Pushing the real target path directly sidesteps that
      // entirely - it's the exact path every "Visión general"/workbench sidebar link already
      // uses successfully.
      this.$router.push('/workbench/home')
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
