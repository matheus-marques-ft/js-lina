<template>
  <Dialog
    v-bind="dialogAttrs"
    :close-on-click-modal="false"
    :visible="visible"
    :title="$tc('AssetManagement')"
    class="asset-dialog"
    top="2vh"
    width="1000px"
    @cancel="handleCancel"
    @close="handleClose"
    @confirm="handleConfirm"
    @update:visible="handleVisibleChange"
  >
    <AssetTreeTable
      ref="ListPage"
      :header-actions="headerActions"
      :node-url="baseNodeUrl"
      :sync-select-to-url="false"
      :table-config="tableConfig"
      :tree-setting="iTreeSetting"
      :tree-url-query="treeUrlQuery"
      :tree-url="`${baseNodeUrl}children/tree/`"
      :url="baseUrl"
      class="tree-table"
      @loaded="handleTableLoaded"
    />
  </Dialog>
</template>

<script>
import AssetTreeTable from '@/components/Apps/AssetTreeTable/index.vue'
import Dialog from '@/components/Dialog/index.vue'

export default {
  componentName: 'AssetSelectDialog',
  components: { AssetTreeTable, Dialog },
  inheritAttrs: false,
  emits: ['cancel', 'confirm', 'update:visible'],
  props: {
    baseUrl: {
      type: String,
      default: '/api/v1/assets/assets/'
    },
    baseNodeUrl: {
      type: String,
      default: '/api/v1/assets/nodes/'
    },
    value: {
      type: Array,
      default: () => []
    },
    visible: {
      type: Boolean,
      default: false
    },
    canSelect: {
      type: Function,
      default(row, index) {
        return true
      }
    },
    disabled: {
      type: [Boolean, Function],
      default: false
    },
    treeUrlQuery: {
      type: Object,
      default: () => ({})
    },
    treeSetting: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    const vm = this
    return {
      isLoaded: false,
      rowSelected: _.cloneDeep(this.value) || [],
      rowsAdd: [],
      tableConfig: {
        url: this.baseUrl,
        hasTree: true,
        canSelect: this.canSelect,
        columns: [
          {
            prop: 'name',
            label: this.$t('Name'),
            sortable: true
          },
          {
            prop: 'address',
            label: this.$t('Address'),
            sortable: 'custom'
          },
          {
            prop: 'platform',
            label: this.$t('Platform'),
            sortable: true,
            formatter: function (row) {
              return row.platform.name
            }
          },
          {
            prop: 'actions',
            has: false
          }
        ],
        listeners: {
          'toggle-row-selection': (isSelected, row) => {
            if (isSelected) {
              vm.addRowToSelect(row)
            } else {
              vm.removeRowFromSelect(row)
            }
          }
        },
        theRowDefaultIsSelected: (row) => {
          return this.value.indexOf(row.id) > -1
        }
      },
      headerActions: {
        hasLeftActions: false,
        hasRightActions: false,
        hasLabelSearch: true,
        searchConfig: {
          getUrlQuery: false
        }
      }
    }
  },
  computed: {
    dialogAttrs() {
      return { ...this.$attrs }
    },
    iTreeSetting() {
      return { ...this.treeSetting, selectSyncToRoute: false }
    }
  },
  methods: {
    handleTableLoaded() {
      this.isLoaded = true
    },
    handleClose() {
      this.$refs.ListPage.$refs.TreeList.componentKey += 1
    },
    handleVisibleChange(val) {
      this.$emit('update:visible', val)
    },
    handleConfirm() {
      this.$emit('update:visible', false)
      this.$emit('confirm', this.rowSelected, this.rowsAdd)
      if (this.rowSelected.length > 0) {
        this.handleClose()
      }
    },
    handleCancel() {
      this.$emit('update:visible', false)
      this.$emit('cancel')
      this.handleClose()
    },
    addRowToSelect(row) {
      const selectValueIndex = this.rowSelected.indexOf(row.id)
      if (selectValueIndex === -1) {
        this.rowSelected.push(row.id)
        this.rowsAdd.push(row)
      }
    },
    removeRowFromSelect(row) {
      const selectValueIndex = this.rowSelected.indexOf(row.id)
      if (selectValueIndex > -1) {
        this.rowSelected.splice(selectValueIndex, 1)
      }
    }
  }
}
</script>

<style lang="scss">
/* =====================================================================
   Asset selection dialog — full-width "master-detail" layout
   - Neither the body nor the two-column container has padding: content
     spans the full edge of the dialog content area. The frame is formed
     by the bottom line of the title bar, the top line of the bottom
     button bar, and a single vertical divider running through the middle,
     instead of floating cards, so there are no gaps inside card borders.
   - Left: asset tree sidebar, full height (tab acts as the header);
     right: search + table, with its own inner padding.
   - Height expands naturally with the right-hand table, the vertical
     divider spans the full height, pagination sits flush at the bottom,
     with no extra whitespace.
   ===================================================================== */
.asset-dialog {
  // The Dialog component globally has `.el-dialog.dialog .el-dialog__body { padding:20px 30px!important }`
  // (0,3,0); a higher specificity (0,4,0) is needed here to override it so the content
  // truly spans full width to the edges.
  &.el-dialog.dialog .el-dialog__body {
    padding: 0 !important;
  }

  .page-heading {
    display: none;
  }

  .tree-table {
    display: flex;
    align-items: stretch;
  }

  // ---------- Left: asset tree / type tree sidebar ----------
  .tree-table .left {
    position: relative; // Anchor: tree body is absolutely positioned and doesn't affect height; sidebar height auto = right-hand table height
    border-right: 1px solid var(--color-border); // Vertical divider running through the middle

    // Tab + tree body fill the entire sidebar
    .auto-data-ztree.tree-tab {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
    }

    // Tab acts as the sidebar header: left/right padding
    .page-submenu {
      flex: 0 0 auto;
      padding: 0 16px;
    }

    // Tree body: fills the space below the header and scrolls independently
    .data-z-tree {
      flex: 1 1 auto;
      min-height: 0;
      padding: 8px 12px;
      overflow: auto;
    }

    .ztree,
    .treebox {
      height: auto !important;
    }
  }

  // ---------- Right: search + table ----------
  .tree-table .right {
    min-width: 0; // Allow the table to shrink correctly inside the dialog

    // Once the collapse button is hidden, the table area fills the right column
    .transition-box {
      flex: 1 1 auto;
      min-width: 0;
      padding: 14px 20px;
    }

    // Top toolbar: combine the "label button + search box" into a single compact
    // control with one shared border (sized to content, not stretched full width),
    // removing the side-by-side small boxes and box-within-box look (the label
    // button, the search box, and the inner badge each previously had their own border).
    .search {
      flex: 0 0 auto; // Shrink to content width; leftover space on the right belongs to the toolbar (borderless), avoiding an empty bordered box
      width: auto;
      margin-right: 0; // Overrides the global `.container:not(:has(.left-side)) .search { margin-right:auto }`
      margin-left: auto; // Push the search control to the right side of the toolbar
      align-items: center;
      min-height: 30px;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      background-color: #fff;

      .label-search {
        margin-right: 0;
      }

      // Label button: remove its own border, separated from the search box only by a right divider line
      .label-button {
        height: 28px;
        border: none !important;
        border-right: 1px solid var(--color-border) !important;
        border-radius: 0 !important;
      }

      // Search box: remove its own outer border (now provided uniformly by .search), keep its natural width
      .right-side-item.action-search {
        border: none !important;
        border-radius: 0 !important;
      }

      // Hide the "/" shortcut badge inside the search box (it has its own border, forming a box-within-box)
      .keydown-focus {
        display: none;
      }
    }
  }

  // The tree collapse button doesn't add much value in this full-width master-detail layout; hide it to keep things tidy
  .tree-table .mini {
    display: none;
  }
}
</style>
