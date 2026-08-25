<template>
  <div v-if="!needHidden(item) && (item.alwaysShow || !allChildrenHidden(item))">
    <template
      v-if="
        hasOneShowingChild(item.children, item) &&
        (!onlyOneChild.children || onlyOneChild.noShowingChildren) &&
        !item.alwaysShow
      "
    >
      <app-link v-if="onlyOneChild.meta" :to="resolvePath(onlyOneChild.path)">
        <el-menu-item
          :class="{ 'submenu-title-noDropdown': !isNest, 'level1-menu': !isNest }"
          :index="resolvePath(onlyOneChild.path)"
          class="submenu-item level2-menu"
        >
          <item
            :icon="onlyOneChild.meta.icon || (item.meta && item.meta.icon)"
            :title="getItemTitle(onlyOneChild)"
          />
        </el-menu-item>
      </app-link>
    </template>

    <template v-else>
      <div class="group-title">
        <el-divider v-if="collapse" />
        <span v-else>{{ getItemTitle(item) }}</span>
      </div>
      <sidebar-item
        v-for="child in item.children"
        :key="child.path"
        :base-path="resolvePath(child.path)"
        :is-nest="true"
        :item="child"
        class="nest-menu"
      />
    </template>
  </div>
</template>

<script>
import Item from './Item'
import AppLink from './Link'
import {
  getItemTitle as computeItemTitle,
  isItemHidden,
  resolveChildPath
} from '@/utils/vue/sidebarMenu'

export default {
  name: 'SidebarItem',
  components: { Item, AppLink },
  props: {
    // route object
    item: {
      type: Object,
      required: true
    },
    isNest: {
      type: Boolean,
      default: false
    },
    basePath: {
      type: String,
      default: ''
    },
    collapse: {
      type: Boolean,
      default: false
    }
  },
  data() {
    // To fix https://github.com/PanJiaChen/vue-admin-template/issues/237
    // TODO: refactor with render function
    this.onlyOneChild = null
    return {}
  },
  methods: {
    needHidden(item) {
      return isItemHidden(item)
    },
    allChildrenHidden(item) {
      if (!item.children) {
        return false
      }
      for (const child of item.children) {
        if (!this.allChildrenHidden(child)) {
          return false
        }
      }
      return true
    },
    getItemTitle(item) {
      return computeItemTitle(item)
    },
    hasOneShowingChild(children = [], parent) {
      const showingChildren = children.filter((item) => {
        if (item.hidden) {
          return false
        } else {
          // Temp set(will be used if only has one showing child)
          this.onlyOneChild = item
          return true
        }
      })

      // When there is only one child router, the child router is displayed by default
      if (showingChildren.length === 1) {
        return true
      }

      // Show parent if there are no child router to display
      if (showingChildren.length === 0) {
        this.onlyOneChild = { ...parent, path: '', noShowingChildren: true }
        return true
      }

      return false
    },
    resolvePath(routePath) {
      return resolveChildPath(this.basePath, routePath)
    }
  }
}
</script>
