<template>
  <div
    :class="{ 'has-logo': showLogo, 'show-orgs': showOrgs, collapsed: isCollapse }"
    class="left-side-wrapper"
  >
    <div class="nav-header">
      <div class="active-mobile">
        <Organization v-if="showOrgs" class="organization" />
      </div>
      <div class="nav-title">
        <span class="switch-view active-switch-view">
          <span style="width: 100%; padding: 0 15px; display: flex; align-items: center">
            <span class="text-overflow">{{ $t('Console') }}</span>
          </span>
        </span>
      </div>
    </div>
    <div class="menu-wrap el-scrollbar">
      <el-menu
        active-text-color="var(--menu-text-active)"
        background-color="var(--menu-bg)"
        :collapse="isCollapse"
        :collapse-transition="false"
        :default-active="activeMenu"
        :default-openeds="defaultOpensMenu"
        text-color="var(--menu-text)"
        :text-weigth="600"
        :unique-opened="false"
        class="left-menu"
        mode="vertical"
      >
        <template v-for="group in groupedSidebarItems" :key="group.category">
          <div v-if="group.title" class="group-title category-title" style="font-size: 12px">
            <el-divider v-if="isCollapse" />
            <span v-else>{{ group.title }}</span>
          </div>
          <sidebar-item
            v-for="route in group.items"
            :key="route.path"
            :base-path="route.path"
            :collapse="isCollapse"
            :item="route"
          />
        </template>
      </el-menu>
    </div>
    <div class="nav-footer">
      <div class="toggle-bar">
        <Hamburger
          :is-active="sidebar.opened"
          class="hamburger-container"
          @toggle-click="toggleSideBar"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import SidebarItem from './SidebarItem'
import Hamburger from '@/components/Widgets/Hamburger'
import Organization from '../NavHeader/Organization'

const CATEGORY_ORDER = ['console', 'pam', 'audit', 'workbench']

export default {
  components: {
    SidebarItem,
    Hamburger,
    Organization
  },
  data() {
    return {
      defaultMenu: []
    }
  },
  computed: {
    ...mapGetters(['currentViewRoute', 'sidebar']),
    defaultOpensMenu() {
      return []
    },
    groupedSidebarItems() {
      const children = this.currentViewRoute.children || []
      const isMergedView = children.some((route) => route.meta?.category)
      if (!isMergedView) {
        // Not a merged screen (Settings/Tickets/Profile/...): render as one flat group,
        // no section header - identical to the pre-merge behavior.
        return [{ category: '__ungrouped__', title: '', items: children }]
      }
      const byCategory = {}
      for (const route of children) {
        const cat = route.meta?.category
        // Children without a category are plumbing (e.g. a bare "/pam" -> "/pam/dashboard"
        // redirect kept alive for deep-linking/getPropView), not real menu entries - they
        // don't render on their own anyway (`hidden: true`), just skip them here too.
        if (!cat) continue
        byCategory[cat] ||= []
        byCategory[cat].push(route)
      }
      const titles = this.currentViewRoute.meta?.categoryTitles || {}
      return CATEGORY_ORDER.filter((cat) => byCategory[cat]?.length).map((cat) => ({
        category: cat,
        title: titles[cat] || '',
        items: byCategory[cat]
      }))
    },
    activeMenu() {
      const route = this.$route
      const { meta, path } = route
      // if set path, the sidebar will highlight the path you set
      if (!meta.activeMenu && !meta.hidden) {
        return path
      }
      if (meta.activeMenu) {
        return meta.activeMenu
      }
      // Hidden route without an explicit activeMenu: strip the dynamic id segment from the
      // current path to highlight the parent menu.
      // Note: vue-router 5's router.resolve() returns the route object directly; it has no
      // .location (that was only in VR3).
      let locPath = path
      const parmaId = route.params?.id
      if (parmaId) {
        locPath = locPath.replace('/' + parmaId, '')
      }
      if (locPath.endsWith('/')) {
        locPath = locPath.slice(0, locPath.length - 1)
      }
      this.$log.debug('Active menu path3: ', locPath)
      return locPath
    },
    showLogo() {
      return this.$store.state.settings.sidebarLogo
    },
    showOrgs() {
      return this.$route.meta?.showOrganization !== false && this.$hasLicense()
    },
    isCollapse() {
      return !this.sidebar.opened
    }
  },
  mounted() {},
  methods: {
    toggleSideBar() {
      this.$store.dispatch('app/toggleSideBar')
    }
  }
}
</script>
<style lang="scss" scoped>
@use '@/styles/variables' as *;

$mobileHeight: 40px;
$origin-color: #ffffff;

.left-side-wrapper {
  .nav-header {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;

    .active-mobile {
      width: 100%;
      display: none;

      :deep(.organization) {
        height: $mobileHeight;
        width: 100%;
        padding: 0 15px;
        background: var(--color-primary-dark-1);
        color: $origin-color;

        .el-select__wrapper {
          width: 100%;
        }

        .el-input--prefix {
          display: flex;
          align-items: center;
          height: 40px;
          line-height: 40px;
        }

        .svg-icon {
          color: $origin-color !important;
          margin-right: 0 !important;
        }
      }

      & :deep(.title-label) {
        color: $origin-color !important;
      }
    }

    .nav-title {
      display: flex;
      align-items: center;
      width: 100%;
      height: 50px;
      font-size: 16px;
      font-weight: 500;
      overflow: hidden;
      white-space: nowrap;
      transition: all 0.3s;
      color: var(--menu-text);
      background-color: var(--menu-bg);
      border-bottom: 1px solid var(--menu-border, var(--color-border));
      border-top: 1px solid var(--menu-border, var(--color-border));

      .switch-view {
        width: 100%;
        padding: 5px;

        .text-overflow {
          width: calc(100% - 15px);
          display: inline-block;
        }
      }
    }
  }

  .nav-footer {
    display: flex;
    justify-content: flex-start;
    color: var(--menu-text);
    border-top: 1px solid var(--menu-border, rgba(31, 35, 41, 0.15));
    background-color: $subMenuBg;

    .toggle-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 54px;
      height: 40px;
      border: 0;
      cursor: pointer;

      :deep(.hamburger-container) {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        padding: 0 !important;

        .svg-icon {
          margin-right: 0 !important;
        }
      }

      &:hover {
        color: var(--menu-text-active);
        background-color: var(--menu-hover-bg, var(--menu-hover));
      }
    }
  }

  &.collapsed .nav-title .switch-view {
    .text-overflow {
      display: none;
    }
  }
}

@media screen and (max-width: 992px) {
  :deep(.active-mobile) {
    display: block !important;
  }
}

// Section header for a merged-in view (Console/PAM/Audit/Workbench), one tier above the
// existing .group-title "app" headers (Users/Assets/...) nested under it - same base look,
// slightly heavier so the two tiers stay visually distinguishable.
.category-title {
  margin-top: 8px;
  border-top: 1px solid var(--menu-border, var(--color-border));

  & > span {
    padding-top: 14px !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    text-transform: uppercase;
  }

  &:first-child {
    margin-top: 0;
    border-top: 0;
  }
}
</style>
