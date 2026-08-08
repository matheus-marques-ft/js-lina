<template>
  <div>
    <ActionsGroup
      :actions="rightSideActions"
      :is-fa="true"
      class="right-side-actions right-side-item"
    />
    <ImExportDialog
      v-bind="$attrs"
      v-if="dialogExportVisible"
      :export-options="iExportOptions"
      :import-options="iImportOptions"
      :selected-rows="selectedRows"
      @import-dialog-close="onImportDialogClose"
      @import-dialog-confirm="onImportDialogConfirm"
    />
  </div>
</template>

<script>
import ActionsGroup from '@/components/Common/ActionsGroup/index.vue'
import { assignIfNot } from '@/utils/common/index'
import ImExportDialog from './ImExportDialog.vue'
import { cleanActions } from './utils'

const defaultTrue = { type: [Boolean, Function, String], default: true }

export default {
  name: 'RightSide',
  components: {
    ActionsGroup,
    ImExportDialog
  },
  props: {
    tableUrl: {
      type: String,
      default: ''
    },
    hasExport: defaultTrue,
    exportOptions: {
      type: Object,
      default: () => ({})
    },
    handleExportClick: {
      type: Function,
      default: null
    },
    hasImport: defaultTrue,
    importOptions: {
      type: Object,
      default: () => ({})
    },
    handleImportClick: {
      type: Function,
      default: null
    },
    hasColumnSetting: defaultTrue,
    handleTableSettingClick: {
      type: Function,
      default: null
    },
    hasRefresh: defaultTrue,
    handleRefreshClick: {
      type: Function,
      default: null
    },
    selectedRows: {
      type: Array,
      default: () => []
    },
    reloadTable: {
      type: Function,
      default: () => {}
    },
    extraRightSideActions: {
      type: Array,
      default: () => []
    },
    canCreate: {
      type: [Boolean, Function, String],
      default: false
    },
    canBulkUpdate: {
      type: [Boolean, Function, String],
      default: false
    }
  },
  emits: ['importDialogClose'],
  data() {
    return {
      dialogExportVisible: false
    }
  },
  computed: {
    defaultRightSideActions() {
      return [
        {
          name: 'actionSetting',
          icon: 'system-setting',
          tip: this.$t('ListPreference'),
          has: this.hasColumnSetting,
          callback: this.handleTableSettingClick || this.defaultHandleTableSettingClickFn
        },
        {
          name: 'actionImport',
          icon: 'upload',
          tip: this.$t('Import'),
          has: this.hasImport,
          callback: this.handleImportClick || this.defaultHandleImportClickFn
        },
        {
          name: 'actionExport',
          icon: 'download',
          tip: this.$t('Export'),
          has: this.hasExport,
          callback: this.handleExportClick || this.defaultHandleExportClickFn
        },
        {
          name: 'actionRefresh',
          icon: 'refresh',
          tip: this.$t('Refresh'),
          has: this.hasRefresh,
          callback: this.handleRefreshClick || this.defaultHandleRefreshClickFn
        }
      ]
    },
    rightSideActions() {
      const actions = [...this.defaultRightSideActions, ...this.extraRightSideActions]
      const params = {
        selectedRows: this.selectedRows,
        reloadTable: this.reloadTable
      }
      return cleanActions(actions, true, params)
    },
    hasSelectedRows() {
      return this.selectedRows.length > 0
    },
    iImportOptions() {
      return assignIfNot(this.importOptions, {
        url: this.tableUrl,
        canImportCreate: this.canCreate,
        canImportUpdate: this.canBulkUpdate
      })
    },
    iExportOptions() {
      /**
       *  This originally used assignIfNot, which internally uses partialRight; that function
       *  only copies a property from the source object when the target object's property is undefined — if the target already has a value, the original value is kept.
       *  So if a tree node is clicked for the first time, the url would then be fixed, and subsequent tree node clicks would no longer carry node info
       *
       */
      // return assignIfNot(this.exportOptions, { url: this.tableUrl })

      return {
        url: this.tableUrl,
        ...this.exportOptions
      }
    }
  },
  methods: {
    defaultHandleExportClickFn({ selectedRows }) {
      const url = this.iExportOptions.url
      this.dialogExportVisible = true
      this.$nextTick(() => {
        this.$eventBus.$emit('showExportDialog', { selectedRows, url, name: this.name })
      })
    },
    defaultHandleTableSettingClickFn({ selectedRows }) {
      this.$eventBus.$emit('showColumnSettingPopover', {
        url: this.tableUrl,
        row: selectedRows,
        name: this.name
      })
    },
    defaultHandleImportClickFn() {
      this.dialogExportVisible = true
      this.$nextTick(() => {
        this.$eventBus.$emit('showImportDialog')
      })
    },
    defaultHandleRefreshClickFn() {
      this.reloadTable()
    },
    handleTagSearch(val) {
      this.searchTable(val)
    },
    onImportDialogClose() {
      this.$emit('importDialogClose')
      setTimeout(() => {
        this.dialogExportVisible = false
      }, 100)
      this.reloadTable()
    },
    onImportDialogConfirm() {
      this.$emit('importDialogClose')
      setTimeout(() => {
        this.dialogExportVisible = false
      }, 100)
      this.reloadTable()
    }
  }
}
</script>

<style lang="scss" scoped>
.right-side-actions.right-side-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  line-height: 30px;

  :deep(.layout) {
    display: flex;
    align-items: center;
  }

  :deep(.action-item.el-button),
  :deep(.action-item.el-dropdown > .el-button),
  :deep(.action-item.el-dropdown .el-button-group .el-button) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 30px;
    height: 30px;
    padding: 0;
  }

  :deep(.action-item.el-button > span),
  :deep(.action-item.el-dropdown > .el-button > span),
  :deep(.action-item.el-dropdown .el-button-group .el-button > span) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    line-height: 1;
  }

  :deep(.el-button) {
    border: none;
    padding: 7px;
    font-size: 13px;
    color: var(--color-text-primary) !important;
    background-color: transparent;

    &:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
  }

  :deep(.svg-icon),
  :deep(.pre-icon),
  :deep(.el-icon),
  :deep(.fa) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 13px;
    height: 13px;
    margin: 0 !important;
    font-size: 13px;
    color: var(--color-text-primary) !important;
  }

  // Icon-only button: inside el-button there's still an el-tooltip__trigger and another div in between,
  // so the outer button's flex centering doesn't automatically propagate to the icon; fill and center the whole chain in between here.
  :deep(.action-item .el-tooltip__trigger),
  :deep(.action-item .el-tooltip__trigger > div) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    line-height: 1;
  }

  // When there's no title, that empty <span> still carries DataActions' margin-left:3px, which pushes the icon off-center.
  // In an icon toolbar the title is always empty, so just remove that span and its margin to truly center the icon.
  :deep(.action-item .pre-icon + span) {
    margin-left: 0;
  }

  :deep(.action-item .pre-icon + span:empty) {
    display: none;
  }
}

.table-action-right-side {
  display: flex;
  justify-content: center;
}
</style>
