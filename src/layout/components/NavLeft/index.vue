<template>
  <div
    :class="{ 'has-logo': showLogo, 'show-orgs': showOrgs, collapsed: isCollapse }"
    class="left-side-wrapper"
  >
    <div class="nav-header">
      <div class="active-mobile">
        <Organization v-if="showOrgs" class="organization" />
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
          <div v-if="group.title" class="group-title category-title">
            <el-divider v-if="isCollapse" />
            <span v-else>{{ group.title }}</span>
          </div>
          <template v-for="row in group.items" :key="row.key">
            <!-- Any route with 2+ visible children (e.g. ACLs, or "Usuários" nested inside
            Reports) is expanded here, at whatever depth it occurs, so its title+children sit
            flat under this <ul> exactly like the category header above - never one extra
            <div> deep inside SidebarItem's own wrapper (see sidebarMenu.js's isGroupRoute/
            flattenSidebarRows for why this has to happen before SidebarItem ever sees it). -->
            <div v-if="row.groupTitle" class="group-title">
              <el-divider v-if="isCollapse" />
              <span v-else>{{ row.groupTitle }}</span>
            </div>
            <sidebar-item
              v-else
              :base-path="row.basePath"
              :class="{ 'nest-menu': row.isNest }"
              :collapse="isCollapse"
              :is-nest="row.isNest"
              :item="row.route"
            />
          </template>
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
import {
  flattenSidebarRows,
  getVisibleChildren,
  hasVisibleContent,
  isGroupRoute,
  resolveChildPath
} from '@/utils/vue/sidebarMenu'

const CATEGORY_ORDER = ['workbench', 'console', 'perms', 'pam', 'audit', 'reports']
// 'console'/'workbench'/'audit' now use real i18n keys (SidebarCategory*, src/i18n/langs/)
// with both an en and a pt_br entry - previously these used the desired Portuguese text as
// the key itself, which only ever looked right in Portuguese (any other language showed the
// same Portuguese label, since nothing else had a matching key).
// 'perms' reuses the existing 'ACLs' key (same one ACLList's own title already used as a
// nested group-title) rather than adding a new i18n entry - it's the same label, just
// promoted one tier up to a category header alongside Management/PAM/Audit.
// 'reports' reuses the 'Report' key AuditsReports' own title already used - user confirmed
// (screenshot from an older build) "Relatório" used to be its own top-level category, sibling
// to Audit, with its report pages flat underneath - not a group nested inside Audit.
const CATEGORY_I18N_KEYS = {
  console: 'SidebarCategoryManagement',
  perms: 'ACLs',
  pam: 'PAM',
  audit: 'SidebarCategoryAudit',
  workbench: 'SidebarCategoryWorkbench',
  reports: 'Report'
}

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
        return [{ category: '__ungrouped__', title: '', items: flattenSidebarRows(children) }]
      }
      const byCategory = {}
      for (const route of children) {
        // menuGroup lets a route be pulled out of its originating view's sidebar bucket
        // (e.g. ACLs/cmd-acls/labels out of 'console') into its own category, WITHOUT
        // touching meta.category itself - Organization.vue keys its org-switcher list and
        // "is this the console view" check off meta.category, so routes that are still
        // org-scoped like Console's are must keep reporting category: 'console' there.
        const cat = route.meta?.menuGroup || route.meta?.category
        // Children without a category are plumbing (e.g. a bare "/pam" -> "/pam/dashboard"
        // redirect kept alive for deep-linking/getPropView), not real menu entries - they
        // don't render on their own anyway (`hidden: true`), just skip them here too.
        if (!cat) continue
        byCategory[cat] ||= []
        // A menuGroup route that would render its own group-title (e.g. ACLList, holding
        // asset-permissions/login-acls/.../connect-method-acls) is the thing BEING promoted
        // into a category - the category header above already carries that same title
        // (see CATEGORY_I18N_KEYS), so push its children in its place instead of the route
        // itself, or flattenSidebarRows would print that title a second time as a redundant
        // group-title row right under the category header. A menuGroup route that collapses
        // to a single child (CmdAclsRoute, ConsoleLabels) isn't affected either way - it
        // never renders a group-title - so it's pushed as-is like any other sidebar entry.
        if (route.meta?.menuGroup && isGroupRoute(route)) {
          // These children carried relative paths ('login-acls', ...) meant to resolve
          // against ACLList's own base path - reproduce that resolution here (the same
          // math flattenSidebarRows would have done via its recursive parentPath) since
          // they're being spliced in one level up, at this bucket's own parentPath ('').
          const basePath = resolveChildPath('', route.path)
          const promotedChildren = getVisibleChildren(route).map((child) => ({
            ...child,
            path: resolveChildPath(basePath, child.path)
          }))
          byCategory[cat].push(...promotedChildren)
        } else {
          byCategory[cat].push(route)
        }
      }
      // .length alone isn't enough here: a route can survive RBAC filtering with
      // children: [] (see hasVisibleContent's doc comment) and still land in this bucket,
      // which would otherwise leave the category title rendered above zero real menu rows.
      return CATEGORY_ORDER.filter((cat) => byCategory[cat]?.some(hasVisibleContent)).map(
        (cat) => ({
          category: cat,
          title: this.$t(CATEGORY_I18N_KEYS[cat]),
          items: flattenSidebarRows(byCategory[cat].filter(hasVisibleContent))
        })
      )
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
  // No explicit height here - this element IS .sidebar-container (layout/index.vue passes
  // that class in, and NavLeft has a single root node, so Vue merges both classes onto the
  // same div). sidebar.scss's .sidebar-container is `position: fixed; top: $headerHeight;
  // bottom: 0` - top+bottom alone already size this box correctly against the viewport. A
  // `height: 100%` here resolves against the viewport too (fixed positioning), making the
  // box exactly one viewport tall STARTING FROM top - i.e. it overflows $headerHeight worth
  // of pixels past the actual bottom of the screen, pushing .nav-footer/the hamburger button
  // below the fold. flex still works fine without it: flexbox distributes free space within
  // whatever height the box ends up with, however that height was determined.
  display: flex;
  flex-direction: column;

  .menu-wrap {
    flex: 1 1 auto;
    min-height: 0;
  }

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
  }

  .nav-footer {
    flex: 0 0 auto;
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
    font-size: 13px !important;
    font-weight: 700 !important;
    text-transform: uppercase;
  }

  &:first-child {
    margin-top: 0;
    border-top: 0;

    & > span {
      padding-top: 0 !important;
    }
  }
}
</style>
