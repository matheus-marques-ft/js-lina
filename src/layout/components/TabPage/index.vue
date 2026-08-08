<template>
  <Page v-bind="$attrs" :title="title" class="tab-page">
    <div class="tab-page-wrapper">
      <div v-if="tabIndices.length > 1 || $slots.headingRightSide" class="tab-page-submenu">
        <el-tabs
          v-if="tabIndices.length > 1"
          v-model="iActiveMenu"
          class="page-submenu"
          @tab-click="handleTabClick"
        >
          <template v-for="item in tabIndices" :key="item.name">
            <el-tab-pane :disabled="item.disabled" :name="item.name">
              <template #label>
                <div class="tab-page-submenu-item-wrapper">
                  <Icon v-if="item.icon" :icon="item.icon" class="pre-icon" />
                  {{ toSentenceCase(item.title) }}
                  <slot :tab="item.name" name="badge" />
                  <el-tooltip
                    v-if="item.helpTip"
                    :show-after="500"
                    effect="dark"
                    placement="bottom"
                    popper-class="help-tips"
                  >
                    <template #content>
                      <div v-sanitize="item.helpTip" class="page-help-content" />
                    </template>
                    <span>
                      <el-button class="help-msg-btn">
                        <el-icon><InfoFilled /></el-icon>
                      </el-button>
                    </span>
                  </el-tooltip>
                </div>
              </template>
            </el-tab-pane>
          </template>
        </el-tabs>

        <div v-if="$slots.headingRightSide" class="tab-page-submenu-right">
          <slot name="headingRightSide" />
        </div>
      </div>

      <div class="tab-page-content">
        <el-alert
          v-if="iHelpMessage && helpAlertVisible"
          class="tab-page-alert"
          :closable="true"
          type="info"
          @close="helpAlertVisible = false"
        >
          <span v-sanitize="iHelpMessage" class="announcement-main" />
        </el-alert>
        <transition v-if="!loading" appear mode="out-in" name="fade-transform">
          <slot>
            <keep-alive v-if="computeActiveComponent">
              <component :is="computeActiveComponent" />
            </keep-alive>
          </slot>
        </transition>
      </div>
    </div>
  </Page>
</template>

<script>
import Icon from '@/components/Widgets/Icon'
import { TAB_NAVIGATION_CONTEXT, TAB_NAVIGATION_SCOPE } from '@/components/Drawer/context'
import { toSentenceCase } from '@/utils/common/index'
import { resolveAsyncComponentCompat } from '@/utils/vue'
import { scopedLocalStorage as localStorage } from '@/utils/storage'
import Page from '../Page/'

export default {
  name: 'TabPage',
  components: {
    Page,
    Icon
  },
  inject: {
    tabNavigationContext: {
      from: TAB_NAVIGATION_CONTEXT,
      default: () => ({ scope: TAB_NAVIGATION_SCOPE.ROUTE })
    }
  },
  props: {
    submenu: {
      type: Array,
      default: () => []
    },
    activeMenu: {
      type: String,
      required: true
    },
    helpMessage: {
      type: String,
      default: ''
    },
    // For compatibility with callers passing the tip via :help-tip. If not declared here,
    // help-tip would pass through $attrs to the inner Page and be rendered as .page-alert
    // (between page-heading and page-submenu), making the tip inconsistent with other pages.
    // It's received explicitly here and rendered uniformly as tab-page-alert inside
    // tab-page-content.
    helpTip: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: ''
    },
    navigationScope: {
      type: String,
      default: 'auto',
      validator: (value) => ['auto', ...Object.values(TAB_NAVIGATION_SCOPE)].includes(value)
    },
    rememberActiveTab: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:activeMenu', 'tab-click'],
  data() {
    return {
      loading: false,
      helpAlertVisible: true,
      toSentenceCase: toSentenceCase,
      activeTab: this.activeMenu
    }
  },
  computed: {
    iHelpMessage() {
      return this.helpMessage || this.helpTip
    },
    effectiveNavigationScope() {
      if (this.navigationScope !== 'auto') {
        return this.navigationScope
      }
      return this.tabNavigationContext.scope
    },
    shouldSyncTabState() {
      return this.effectiveNavigationScope === TAB_NAVIGATION_SCOPE.ROUTE
    },
    activeTabStorageKey() {
      const routeKey =
        this.$route.name || this.$route.meta?.fullPath || this.$route.path || 'default'
      return `activeTab:${routeKey}`
    },
    iActiveMenu: {
      get() {
        return this.activeTab
      },
      set(item) {
        this.activeTab = item
        this.$emit('update:activeMenu', item)
      }
    },
    tabIndices() {
      const map = []
      this.submenu.forEach((v) => {
        const hidden = typeof v.hidden === 'function' ? v.hidden() : v.hidden
        if (!hidden) {
          map.push(v)
        }
      })
      return map
    },
    computeActiveComponent() {
      let needActiveComponent = ''
      for (const i of this.submenu) {
        if (i.component && i.name === this.iActiveMenu) {
          needActiveComponent = this.resolveComponent(i.component)
          break
        }
      }
      return needActiveComponent
    }
  },
  watch: {
    activeMenu: {
      handler(newValue) {
        this.activeTab = newValue
      }
    },
    '$route.query.tab'() {
      if (!this.shouldSyncTabState) {
        return
      }
      this.syncActiveTab()
    },
    activeTabStorageKey() {
      this.syncActiveTab()
    },
    iActiveMenu(newValue) {
      if (!newValue) {
        return
      }
      if (!this.shouldSyncTabState) {
        return
      }
      if (this.rememberActiveTab) {
        localStorage.setItem(this.activeTabStorageKey, newValue)
      }
      if (this.$route.query?.tab === newValue) {
        return
      }
      this.$router.replace({
        path: this.$route.path,
        query: {
          ...this.$route.query,
          tab: newValue
        },
        hash: this.$route.hash
      })
    },
    iHelpMessage() {
      this.helpAlertVisible = true
    }
  },
  created() {
    this.syncActiveTab()
    this.loading = false
  },
  methods: {
    handleTabClick(tab) {
      // Element Plus exposes the pane name as `paneName`. Keep `name` in the
      // forwarded event for existing consumers, but let el-tabs' v-model be
      // the single source of truth for the active tab. Reassigning from the
      // obsolete `tab.name` clears the active component on repeated clicks.
      const name = tab.paneName ?? tab.name ?? tab.props?.name
      this.$emit('tab-click', tab.name === name ? tab : { ...tab, name })
    },
    resolveComponent(component) {
      return resolveAsyncComponentCompat(component)
    },
    getPropActiveTab() {
      let activeTab = ''

      const preActiveTabs = this.shouldSyncTabState
        ? [
            this.$route.query['tab'],
            this.rememberActiveTab ? localStorage.getItem(this.activeTabStorageKey) : undefined,
            this.activeMenu
          ]
        : [this.activeMenu]

      for (const preTab of preActiveTabs) {
        const currentTab = typeof preTab === 'object' ? preTab?.name || '' : preTab
        for (const tabName of this.tabIndices) {
          const currentTabName = tabName?.name || ''
          if (currentTab?.toLowerCase() === currentTabName?.toLowerCase()) {
            return currentTabName
          }
        }
      }

      activeTab = this.tabIndices[0]?.name || ''
      return activeTab
    },
    syncActiveTab() {
      const activeTab = this.getPropActiveTab()
      if (!activeTab) {
        return
      }
      this.activeTab = activeTab
      if (this.activeMenu !== activeTab) {
        this.$emit('update:activeMenu', activeTab)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.page.no-title {
  :deep(.page-submenu) {
    .el-tabs__header {
      margin-top: 0;
    }

    .tab-page-content {
      height: calc(100% - 45px);
    }
  }
}

.page-submenu {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
}

.page-submenu :deep(.el-tabs__header) {
  background-color: white;
  margin-top: -10px;
  margin-bottom: 0;
  padding: 0 20px;
  display: flex;
  align-items: stretch;
  min-height: 40px;
  border-bottom: 1px solid #ebeef5;
}

.page-submenu :deep(.el-tabs__nav-wrap),
.page-submenu :deep(.el-tabs__nav-scroll),
.page-submenu :deep(.el-tabs__nav) {
  display: flex;
  align-items: stretch;
}

.page-submenu :deep(.el-tabs__nav-wrap) {
  flex: 1 1 auto;
  margin: 0;

  &::after {
    display: none;
  }
}

.page-submenu :deep(.el-tabs__active-bar) {
  height: 2px;
}

.page-submenu :deep(.el-tabs__item) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  line-height: 40px;
  padding: 0 18px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);

  .pre-icon {
    width: 16px;
    display: inline-block;
    opacity: 0.6;
  }

  &.is-active {
    .pre-icon {
      opacity: 1;
    }
  }

  &.is-disabled {
    cursor: not-allowed;

    &:hover {
      color: #c0c4cc;
    }
  }
}

.page-submenu :deep(.el-tabs__item .el-tooltip__trigger),
.page-submenu :deep(.el-tabs__item .help-msg-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 13px;
  height: 13px;
  min-height: 13px;
  padding: 0;
  border: none;
  background: transparent !important;
  box-shadow: none;
}

.page-submenu :deep(.el-tabs__item .help-msg-btn .el-icon),
.page-submenu :deep(.el-tabs__item .help-msg-btn .el-icon svg),
.page-submenu :deep(.el-tabs__item .el-tooltip__trigger .el-icon),
.page-submenu :deep(.el-tabs__item .el-tooltip__trigger .el-icon svg) {
  width: 13px;
  height: 13px;
  font-size: 13px;
  color: var(--color-info);
}

.page-submenu :deep(.el-tabs__header) {
  .el-tabs__nav-next {
    right: 10px;
  }

  .el-tabs__nav-prev {
    left: 10px;
  }
}

.tab-page {
  .tab-page-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .tab-page-submenu {
    display: flex;
    align-items: center;
    background-color: white;
    margin-bottom: 5px;
    overflow: visible;
  }

  .tab-page-submenu .page-submenu {
    flex: 1 1 auto;
    min-width: 0;
  }

  .tab-page-submenu-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-left: 12px;
    padding-right: 20px;
    flex-shrink: 0;
  }

  .tab-page-submenu-right :deep(.el-button) {
    padding: 5px 8px;
  }

  :deep(.page-heading) {
    border-bottom: none;
  }

  :deep(.page-content) {
    overflow-y: hidden !important;
    padding: 0;
  }

  .tab-page-content {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
    padding: 10px 20px 0;
    overflow: auto;
    scrollbar-gutter: stable;

    // Tab content keeps a consistent usable width; when the viewport or drawer keeps
    // narrowing, the content area scrolls instead of letting forms, help text, and complex
    // controls compress indefinitely.
    > :deep(*) {
      flex-shrink: 0;
      min-width: 600px;
      box-sizing: border-box;
    }

    /*
     * A flex column + overflow-y:auto container clips its own padding-bottom (a known Chrome
     * behavior), so the last block of content ends up flush against the edge when scrolled to
     * the bottom. An ::after placeholder that isn't subject to the clipping restores the
     * bottom spacing.
     */
    &::after {
      content: '';
      display: block;
      flex: 0 0 22px;
      height: 22px;
    }
  }

  /*
   * .tab-page-content is the sole scroll container: when space is short on small screens, it
   * should scroll as a whole rather than letting inner cards show their own scrollbar. So
   * card-related containers are forced to not have their own scroll / max-height, handing
   * overflow back to .tab-page-content.
   */
  .tab-page-content :deep(.el-card__body),
  .tab-page-content :deep(.ibox),
  .tab-page-content :deep(.el-card) {
    overflow: visible !important;
    max-height: none !important;
  }

  // Settings page form labels are uniformly left-aligned within the fixed label column, to
  // avoid them sticking to the right side of the control at narrow widths.
  .tab-page-content :deep(.form-fields .el-form-item__label-wrap) {
    display: flex;
    justify-content: flex-start;
  }

  .tab-page-content :deep(.form-fields .el-form-item__label) {
    justify-content: flex-start;
    text-align: left;
  }

  /*
   * <transition mode="out-in"> and <keep-alive> require a single root node, so content
   * components commonly wrap multiple blocks (e.g. el-alert + IBox) in one <div> (no class,
   * or class=""). This wrapper becomes the only flex child, causing the outer gap to have no
   * effect on its inner blocks. Here the purely structural wrapper is made a flex column
   * itself, reusing the same gap — restoring spacing between blocks while keeping the
   * wrapper's box to preserve the fade-transform transition animation.
   *
   * During the transition animation, Vue adds fade-transform-* classes to the wrapper, at
   * which point :not([class]) no longer matches, so [class^="fade-transform"] is added to
   * keep it flex during the animation and avoid spacing flicker. Wrappers with a class (e.g.
   * .auth-container) start with their own class name and never match either selector, so they
   * remain unaffected.
   */
  .tab-page-content > :deep(div:not([class])),
  .tab-page-content > :deep(div[class='']),
  .tab-page-content > :deep(div[class^='fade-transform']) {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .tab-page-content :deep(.tab-page-alert) {
    margin: 0;
  }

  .tab-page-content :deep(.tab-page-alert .el-alert__icon) {
    font-size: 16px;
  }

  .tab-page-content :deep(.tab-page-alert .el-alert__icon .el-icon),
  .tab-page-content :deep(.tab-page-alert .el-alert__icon .el-icon svg) {
    width: 16px;
    height: 16px;
    font-size: 16px;
  }

  .tab-page-content :deep(.tab-page-alert .el-alert__title),
  .tab-page-content :deep(.tab-page-alert .el-alert__description),
  .tab-page-content :deep(.tab-page-alert .el-alert__content),
  .tab-page-content :deep(.tab-page-alert .announcement-main) {
    font-size: 12px !important;
    line-height: 1.5;
  }

  .tab-page-content :deep(.tab-page-alert .el-alert__closebtn) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    font-size: 16px;
  }
}

.page-submenu :deep(.el-tabs__nav-wrap) {
  position: static;
}

.fa {
  margin-right: 2px;
}
</style>
