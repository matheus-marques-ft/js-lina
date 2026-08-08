<template>
  <div v-bind="rootAttrs" :class="rootClass" :style="rootStyle">
    <template v-if="showNoData">
      <!--@slot Content to show when the data is empty-->
      <slot name="no-data" />
    </template>
    <template v-else>
      <!--
        Filter out the passthrough of selection-related events, to avoid the parent
        component receiving el-table's native "current page" selection, which would
        overwrite cross-page selection (persistSelection), leaving only the current
        page's data. Selection events all go through selectStrategy, which maintains
        the full selected set internally and emits it outward.
      -->
      <div v-loading="tableLoading">
        <el-table
          v-bind="tableAttrs"
          ref="table"
          :data="data"
          :row-class-name="rowClassName"
          @select="selectStrategy.onSelect"
          v-on="forwardListeners"
          @selection-change="selectStrategy.onSelectionChange"
          @select-all="handleSelectAll($event, canSelect)"
          @sort-change="onSortChange"
        >
          <template v-if="isTree">
            <el-data-table-column
              v-bind="{ align: columnsAlign, ...columns[0] }"
              v-if="hasSelect"
              key="selection-key"
            />
            <el-data-table-column
              v-bind="treeControlColumn"
              :key="treeControlColumn.prop || 'tree-ctrl'"
            >
              <template #default="scope">
                <span v-for="space in scope.row._level" :key="space" class="ms-tree-space" />
                <span
                  v-if="iconShow(scope.$index, scope.row)"
                  class="tree-ctrl"
                  @click="toggleExpanded(scope.$index)"
                >
                  <el-icon><component :is="scope.row._expanded ? 'Minus' : 'Plus'" /></el-icon>
                </span>
                {{ scope.row[treeLabelProp] }}
              </template>
            </el-data-table-column>

            <el-data-table-column
              v-bind="{ align: columnsAlign, ...col }"
              v-for="col in treeDataColumns"
              :key="col.prop"
            />
          </template>

          <!--not tree-->
          <template v-else>
            <el-data-table-column
              v-if="hasSelection"
              :align="selectionAlign"
              :fixed="selectionFixed"
              :selectable="canSelect"
              :width="selectionWidth || undefined"
              type="selection"
            />
            <el-table-column
              v-bind="getColumnBindProps(col)"
              v-for="col in displayColumns"
              :key="col.prop"
              :filter-method="typeof col.filterMethod === 'function' ? col.filterMethod : null"
              :filter-multiple="false"
              :filters="col.filters || null"
              :formatter="typeof col.formatter === 'function' ? col.formatter : null"
              :title="col.label"
              :prop="col.prop"
            >
              <template #header>
                <span class="column-header-content">
                  <span :title="col.label">{{ col.label }}</span>
                  <button
                    v-if="col.pinState?.visible"
                    :aria-label="$t(col.pinState.pinned ? 'UnpinColumn' : 'PinColumn')"
                    :class="['column-pin-button', { 'is-pinned': col.pinState.pinned }]"
                    :title="$t(col.pinState.pinned ? 'UnpinColumn' : 'PinColumn')"
                    type="button"
                    @click.stop="$emit('column-pin-toggle', col.prop)"
                    @mousedown.stop
                  >
                    <i class="fa fa-thumb-tack" />
                  </button>
                </span>
              </template>

              <template
                v-if="col.formatter && typeof col.formatter !== 'function'"
                #default="{ row: tableRow, column, $index }"
              >
                <component
                  :is="getFormatterComponent(col)"
                  :key="tableRow.id"
                  :cell-value="tableRow[col.prop]"
                  :col="col"
                  :column="column"
                  :index="$index"
                  :reload="getList"
                  :row="tableRow"
                  :table-data="data"
                  :url="url"
                />
              </template>
            </el-table-column>
          </template>
          <slot />
        </el-table>
      </div>

      <el-pagination
        v-if="hasPagination"
        v-bind="{
          ...normalizedExtraPaginationAttrs,
          currentPage: paginationCurrentPage,
          pageSize: paginationPageSize,
          background: paginationBackground,
          layout: paginationLayout,
          pageSizes: paginationSizes,
          total: total || 0,
          'onUpdate:current-page': handleCurrentChange,
          'onUpdate:page-size': handleSizeChange
        }"
      />

      <the-dialog
        ref="dialog"
        :button-size="buttonSize"
        :dialog-attrs="dialogAttrs"
        :edit-title="iDialogEditTitle"
        :form="form"
        :form-attrs="formAttrs"
        :new-title="iDialogNewTitle"
        :view-title="iDialogViewTitle"
        @confirm="onConfirm"
      >
        <template #default="scope">
          <!-- @slot Form scoped slot. Row is passed in when editing/viewing; row=null when creating -->
          <slot :row="scope.row" name="form" />
        </template>
      </the-dialog>
    </template>
  </div>
</template>

<script>
import { omitVueListeners, pickVueListeners } from '@/utils/vue'
import { markRaw, toRaw } from 'vue'
import merge from 'deepmerge'
import _get from 'lodash/get'
import _isEmpty from 'lodash/isEmpty'
import _values from 'lodash/values'
import ElDataTableColumn from './components/el-data-table-column'
import SelfLoadingButton from './components/self-loading-button.vue'
import TheDialog, { dialogModes } from './components/the-dialog.vue'
import getLocatedSlotKeys from './utils/extract-keys'
import isFalsey from './utils/is-falsey'
import * as queryUtil from './utils/query'
import transformSearchImmediatelyItem from './utils/search-immediately-item'
import getSelectStrategy from './utils/select-strategy'

const defaultFirstPage = 1
const noPaginationDataPath = 'payload'

export default {
  name: 'ElDataTable',
  components: {
    SelfLoadingButton,
    TheDialog,
    ElDataTableColumn
  },
  inheritAttrs: false,

  props: {
    /**
     * Request URL. If empty, no request is sent; changing the URL causes the table to send a new request
     */
    url: {
      type: String,
      default: ''
    },
    request: {
      type: Function,
      default: null
    },
    /**
     * Primary key, defaults to id.
     * Used when editing/deleting - the request obtains the primary key from the defined property value, i.e. row[this.id]
     */
    id: {
      type: String,
      default: 'id'
    },
    /**
     * The value of the first page for pagination requests (some APIs treat 0 as the first page)
     */
    firstPage: {
      type: Number,
      default: defaultFirstPage
    },
    /**
     * The path of the pagination data to render within the data returned by the API. Use "." to indicate nested objects
     */
    dataPath: {
      type: String,
      default: 'payload.content'
    },
    /**
     * The path of the total count of paginated data within the data returned by the API. Use "." to indicate nested objects
     */
    totalPath: {
      type: String,
      default: 'payload.totalElements'
    },
    /**
     * Can be specified if the API expects a different query key for the page number
     */
    pageKey: {
      type: String,
      default: 'page'
    },
    /**
     * Can be specified if the API expects a different query key for the page size
     */
    pageSizeKey: {
      type: String,
      default: 'size'
    },
    /**
     * Column property settings, see the element-ui official site for details
     * @link https://element.eleme.cn/2.4/#/zh-CN/component/table#table-column-attributes
     */
    columns: {
      type: Array,
      default() {
        return []
      }
    },
    /**
     * Can transform the query content before the request, providing a way to customize the query -
     * e.g. some pagination uses an offset mechanism, offset = page * size, limit = size
     */
    transformQuery: {
      type: Function,
      default: null
    },
    /**
     * Search field rendering, see el-form-renderer for configuration reference
     * @link https://femessage.github.io/el-form-renderer/
     */
    searchForm: {
      type: Array,
      default() {
        return []
      }
    },
    /**
     * Whether to enable the search bar collapse feature
     */
    canSearchCollapse: {
      type: Boolean,
      default: false
    },
    /**
     * Function executed before the query when the search button is clicked. Parameter is the form data; must return a Promise
     */
    beforeSearch: {
      type: Function,
      default() {}
    },
    /**
     * Single selection, use case: batch deletion not allowed
     */
    single: {
      type: Boolean,
      default: false
    },
    /**
     * Checked items are not lost when switching pages
     */
    persistSelection: {
      type: Boolean,
      default: false
    },
    /**
     * Whether there is an operation column
     */
    hasOperation: {
      type: Boolean,
      default: true
    },
    /**
     * Custom buttons for the operation column, rendered as element-ui buttons, supporting the following
     * properties including style:
     * {type: '', text: '', atClick: row => Promise.resolve(), show: row => return true to display, disabled: row => return true to disable }
     * Click event row parameter represents the current row's data, must return a Promise; by default the
     * table refreshes after clicking, resolve(false) to skip the refresh
     */
    extraButtons: {
      type: Array,
      default() {
        return []
      }
    },
    /**
     * Custom buttons in the header, rendered as element-ui buttons, supporting the following properties
     * including style:
     * {type: '', text: '', atClick: selected => Promise.resolve(), show: selected => return true to display, disabled: selected => return true to disable}
     * Click event selected parameter represents the array of selected rows; the function must return a
     * Promise, by default the table refreshes after clicking, resolve(false) to skip the refresh
     */
    headerButtons: {
      type: Array,
      default() {
        return []
      }
    },
    /**
     * Whether there is an add button
     */
    hasNew: {
      type: Boolean,
      default: true
    },
    /**
     * Whether there is an action button
     */
    hasAction: {
      type: Boolean,
      default: true
    },
    /**
     * Whether there is an action button
     */
    hasUpload: {
      type: Boolean,
      default: true
    },
    /**
     * Whether there is an edit button
     */
    hasEdit: {
      type: Boolean,
      default: true
    },
    /**
     * Whether there is a view button
     */
    hasView: {
      type: Boolean,
      default: false
    },
    /**
     * Whether the table header has a delete button (this button only appears when multi-select is enabled)
     */
    hasDelete: {
      type: Boolean,
      default: true
    },
    /**
     * Add button text
     */
    newText: {
      type: String,
      default: function () {
        return 'Add'
      }
    },
    /**
     * Edit button text
     */
    editText: {
      type: String,
      default: function () {
        return 'Modify'
      }
    },
    /**
     * View button text
     */
    viewText: {
      type: String,
      default: function () {
        return 'View'
      }
    },
    /**
     * Delete button text
     */
    deleteText: {
      type: String,
      default: function () {
        return 'Delete'
      }
    },
    /**
     * Delete confirmation message. Accepts the data to be deleted (a single object or array); returns a string
     * @param {object|object[]} data to delete - a single object or array
     * @return {string}
     */
    deleteMessage: {
      type: Function,
      default() {
        return 'Confirm' + this.deleteText + '?'
      }
    },
    /**
     * Whether a row's data can be deleted; returning true means it can. Controls the single-row delete
     * button when in single-select mode
     */
    canDelete: {
      type: Function,
      default() {
        return true
      }
    },
    canEdit: {
      type: Function,
      default() {
        return true
      }
    },
    /**
     * Method called when the add button is clicked; used when the default add method doesn't meet
     * requirements, must return a promise.
     * Parameters (data, row): data is the form data, row is the current row's data - only has a value
     * when isTree is true and the add button in the operation column is clicked
     */
    onNew: {
      type: Function,
      default(data) {
        console.log('onNew', data)
      }
    },
    /**
     * Method called when the edit button is clicked; used when the default edit method doesn't meet
     * requirements, must return a promise.
     * Parameters (data, row): data is the form data, row is the current row's data
     */
    onEdit: {
      type: Function,
      default(row) {}
    },
    /**
     * Method called when the delete button is clicked; used when the default delete method doesn't meet
     * requirements, must return a promise.
     * When multi-select: parameter is selected, an array of the selected rows; when not multi-select:
     * parameter is row, a single row's data
     */
    onDelete: {
      type: Function,
      default(data) {
        // const ids = Array.isArray(data) ? data.map(v => v[this.id]).join(',') : data[this.id]
        // return this.$axios.delete(this.url + '/' + ids + '/', this.axiosConfig)
        console.log('onDelete', data)
      }
    },
    /**
     * Function called after a successful crud operation, defaults to this.$message.success('SuccessfulOperation')
     * Accepts two parameters:
     * type - the operation type, possible values are new | edit | delete;
     * data - the operation's data object
     */
    onSuccess: {
      type: Function,
      default() {
        return this.$message.success('SuccessfulOperation')
      }
    },
    /**
     * Whether to paginate. If not paginated, the request is sent with page=-1
     */
    hasPagination: {
      type: Boolean,
      default: true
    },
    /**
     * The pagination component's child-component layout, child component names separated by commas,
     * corresponds to element-ui pagination's layout property
     * @link https://element.eleme.cn/2.4/#/zh-CN/component/pagination
     */
    paginationLayout: {
      type: String,
      default: 'total, sizes, prev, pager, next, jumper'
    },
    /**
     * The option settings for the pagination component's page-size selector, corresponds to element-ui
     * pagination's page-sizes property
     * @link https://element.eleme.cn/2.4/#/zh-CN/component/pagination
     */
    paginationSizes: {
      type: Array,
      default: () => [10, 20, 30, 40, 50]
    },
    paginationPagerCount: {
      type: Number,
      default: 5
    },
    /**
     * The default option for the pagination component's page-size selector, corresponds to element-ui
     * pagination's page-size property
     * @link https://element.eleme.cn/2.4/#/zh-CN/component/pagination
     */
    paginationSize: {
      type: Number,
      default: 10
    },
    /**
     * @deprecated
     * The size value when not paginating (it's recommended the API convention sends page=-1 when not
     * paginating, so this property is generally not used)
     */
    noPaginationSize: {
      type: Number,
      default: 999
    },
    /**
     * Whether the data to render is a tree structure
     */
    isTree: {
      type: Boolean,
      default: false
    },
    /**
     * Tree structure related: the field name of the child node
     */
    treeChildKey: {
      type: String,
      default: 'children'
    },
    /**
     * Tree structure related: the field name of the parent node
     */
    treeParentKey: {
      type: String,
      default: 'parentId'
    },
    /**
     * Tree structure related: the source field for the parent node field's value.
     * Used when adding/editing - for example, adding a child node under a node with id 2 means the child's
     * parentId is 2, i.e. the value of parentId comes from the field id, so treeParentValue is id
     */
    treeParentValue: {
      type: String,
      default: 'id'
    },
    /**
     * Tree structure related: whether to expand all nodes
     */
    expandAll: {
      type: Boolean,
      default: false
    },
    /**
     * element table property settings, see the element-ui official site for configuration reference
     * @link https://element.eleme.cn/2.4/#/zh-CN/component/table#table-attributes
     */
    tableAttrs: {
      type: Object,
      default() {
        return {}
      }
    },
    /**
     * Operation column properties
     * @link https://element.eleme.cn/2.4/#/zh-CN/component/table#table-column-attributes
     */
    operationAttrs: {
      type: Object,
      default() {
        return { width: '', fixed: 'right' }
      }
    },
    /**
     * The title of the add dialog, defaults to the value of newText
     */
    dialogNewTitle: {
      type: String,
      default: ''
    },
    /**
     * The title of the edit dialog, defaults to the value of editText
     */
    dialogEditTitle: {
      type: String,
      default: ''
    },
    /**
     * The title of the view dialog, defaults to the value of viewText
     */
    dialogViewTitle: {
      type: String,
      default: ''
    },
    /**
     * Dialog form, used for adding and editing, see el-form-renderer for configuration reference
     * @link https://femessage.github.io/el-form-renderer/
     */
    form: {
      type: Array,
      default() {
        return []
      }
    },
    /**
     * Dialog form property settings, see the element-ui official site for configuration reference
     * @link https://element.eleme.cn/2.4/#/zh-CN/component/form#form-attributes
     */
    formAttrs: {
      type: Object,
      default() {
        return {}
      }
    },
    /**
     * Dialog property settings, see the element-ui official site for configuration reference
     * @link https://element.eleme.cn/2.4/#/zh-CN/component/dialog#attributes
     */
    dialogAttrs: {
      type: Object,
      default() {
        return {}
      }
    },
    /**
     * Same as extraBody
     * @deprecated
     */
    extraParams: {
      type: Object,
      default() {
        return undefined
      }
    },
    /**
     * Extra parameters included in the request body when submitting an add/edit.
     */
    extraBody: {
      type: Object,
      default() {
        return undefined
      }
    },
    /**
     * Called when confirm is clicked in the add/edit dialog; returns a Promise - if rejected, the
     * add/edit request is not sent
     * Parameters: (data, isNew) data is the form data, isNew true means it's the add dialog, false means
     * the edit dialog
     */
    beforeConfirm: {
      type: Function,
      default() {
        return Promise.resolve()
      }
    },
    /**
     * Same as extraQuery
     * @deprecated
     */
    customQuery: {
      type: Object,
      default() {
        return undefined
      }
    },
    /**
     * Extra parameters added to the request URL.
     * Can use the .sync modifier, in which case this parameter is also reset after clicking the reset button
     */
    extraQuery: {
      type: Object,
      default() {
        return {}
      }
    },
    /**
     * Whether to enable saving query parameters via the URL
     */
    saveQuery: {
      type: Boolean,
      default: true
    },
    /**
     * Operation bar button type
     * `text` is a text button, `button` is a regular button
     */
    operationButtonType: {
      type: String,
      default: 'text'
    },
    /**
     * Set the `button` size
     * @see https://element.eleme.cn/#/zh-CN/component/button#bu-tong-chi-cun
     */
    buttonSize: {
      type: String,
      default: 'small'
    },
    /**
     * Set axios config parameters
     */
    axiosConfig: {
      type: Object,
      default() {
        return {}
      }
    },
    /*
     * Set the default alignment
     */
    defaultAlign: {
      type: String,
      default: 'center'
    },
    selectionAlign: {
      type: String,
      default: 'center'
    },
    selectionFixed: {
      type: [Boolean, String],
      default: false
    },
    selectionWidth: {
      type: [Number, String],
      default: 0
    },
    leadingColumn: {
      type: String,
      default: ''
    },
    paginationBackground: {
      type: Boolean,
      default: true
    },
    extraPaginationAttrs: {
      type: Object,
      default: () => {}
    },
    hasSelection: {
      type: Boolean,
      default: true
    },
    hasDetail: {
      type: Boolean,
      default: true
    },
    canSelect: {
      type: Function,
      default(row, index) {
        return true
      }
    },
    totalData: {
      type: Array,
      default: null
    }
  },
  data() {
    return {
      data: [],
      size: this.paginationSize || this.paginationSizes[0],
      page: defaultFirstPage,
      // https://github.com/ElemeFE/element/issues/1153
      total: null,
      tableLoading: false,
      // Array of multi-selected items
      selected: [],

      // The row being edited
      row: {},

      // The initial extraQuery value, used when resetting the query
      // JSON.stringify is for later deep-copy purposes
      initExtraQuery: JSON.stringify(this.extraQuery || this.customQuery || {}),
      isSearchCollapse: false,
      showNoData: false,
      innerQuery: {}
    }
  },
  computed: {
    displayColumns() {
      if (!this.leadingColumn) {
        return this.columns
      }
      const leading = this.columns.find((column) => column.prop === this.leadingColumn)
      if (!leading) {
        return this.columns
      }
      return [leading, ...this.columns.filter((column) => column !== leading)]
    },
    paginationCurrentPage: {
      get() {
        return this.page
      },
      set(val) {
        this.handleCurrentChange(val)
      }
    },
    paginationPageSize: {
      get() {
        return this.size
      },
      set(val) {
        this.handleSizeChange(val)
      }
    },
    normalizedExtraPaginationAttrs() {
      const attrs = { ...(this.extraPaginationAttrs || {}) }
      if ('small' in attrs) {
        if (attrs.small && !attrs.size) {
          attrs.size = 'small'
        }
        delete attrs.small
      }
      return attrs
    },
    hasSelect() {
      return this.columns.length && this.columns[0].type === 'selection'
    },
    selectable() {
      if (this.hasSelect && this.columns[0].selectable) {
        return this.columns[0].selectable
      }
      return () => true
    },
    columnsAlign() {
      if (this.columns.some((col) => col.columns && col.columns.length)) {
        // Multi-level header centered by default
        return 'center'
      } else {
        // Centered by default //modification point
        return this.defaultAlign
      }
    },
    treeColumnIndex() {
      return this.hasSelect ? 1 : 0
    },
    treeControlColumn() {
      const column = this.columns[this.treeColumnIndex] || {}
      return { align: this.columnsAlign, ...column }
    },
    treeDataColumns() {
      const start = this.hasSelect ? 2 : 1
      return this.columns.slice(start)
    },
    treeLabelProp() {
      const column = this.columns[this.treeColumnIndex] || {}
      return column.prop
    },
    routerMode() {
      return this.$router ? this.$router.mode : 'hash'
    },
    hasSearchForm() {
      return this.searchForm.length || this.$slots.search
    },
    hasHeader() {
      return (
        this.hasNew ||
        (this.hasSelect && this.hasDelete) ||
        this.headerButtons.length ||
        this.canSearchCollapse ||
        this.$slots.header
      )
    },
    _extraBody() {
      return this.extraBody || this.extraParams || {}
    },
    _extraQuery() {
      return this.extraQuery || this.customQuery || {}
    },
    selectStrategy() {
      return getSelectStrategy(this)
    },
    rootAttrs() {
      const attrs = omitVueListeners(this.$attrs)
      delete attrs.class
      delete attrs.style
      return attrs
    },
    rootClass() {
      return ['el-data-table', this.$attrs.class]
    },
    rootStyle() {
      return this.$attrs.style
    },
    iDialogNewTitle() {
      return this.dialogNewTitle || this.newText
    },
    iDialogEditTitle() {
      return this.dialogEditTitle || this.editText
    },
    iDialogViewTitle() {
      return this.dialogViewTitle || this.viewText
    },
    // Filter out events that would conflict with the internal selection strategy, to avoid the parent
    // component only getting the current page's selection
    forwardListeners() {
      const listeners = { ...pickVueListeners(this.$attrs) }
      delete listeners['selection-change']
      delete listeners['select']
      delete listeners['select-all']
      // If the outer component needs to listen for selection changes, listen to this component's
      // exposed selection-change event, which comes from the selection strategy and has already
      // aggregated the full selected set across pages
      return listeners
    },
    searchLocatedSlotKeys() {
      return getLocatedSlotKeys(this.$slots, 'search:')
    },
    collapseForm() {
      return this.searchForm.map((item) => {
        if ('collapsible' in item && !item.collapsible) {
          return item
        }

        const itemHidden = item.hidden || (() => false)
        return {
          ...item,
          hidden: (data) => {
            return this.isSearchCollapse || itemHidden(data)
          }
        }
      })
    },
    _searchForm() {
      return transformSearchImmediatelyItem(this.collapseForm, this)
    },
    lastPageNum() {
      // page
      const pageOffset = this.firstPage - defaultFirstPage
      const pageCount = Math.ceil(this.total / this.size)
      const lastPageNum = pageCount + pageOffset
      return lastPageNum
    }
  },
  watch: {
    url: {
      handler(val) {
        if (!val) return
        this.page = defaultFirstPage
        // mounted has updateForm behavior, so at least during the initial execution we need to wait
        // for nextTick
        this.$nextTick(this.getList)
      },
      immediate: true
    },
    selected(val) {
      /**
       * The multi-select set changed
       * @property {array} rows - array of the selected rows' data
       */
      this.$emit('selection-change', val)
    },
    totalData(val) {
      if (val && val.length !== this.total) {
        this.page = defaultFirstPage
        this.total = val.length
        this.$nextTick(() => this.getList())
      }
    }
  },
  mounted() {
    if (this.saveQuery) {
      const query = queryUtil.get(location.href)
      if (query) {
        this.page = parseInt(query[this.pageKey])
        this.size = parseInt(query[this.pageSizeKey])

        // Restore the query conditions, but this has no effect for slot = search
        if (this.$refs.searchForm) {
          delete query[this.pageKey]
          delete query[this.pageSizeKey]
          this.$refs.searchForm.updateForm(query)
        }
      }
    }
    if (this.totalData) {
      this.getList()
    }
  },
  created() {
    this.debouncedGetListFromRemote = _.debounce(this.getListFromRemote, 300)
  },
  methods: {
    getFormatterComponent(col) {
      if (!col?.formatter || typeof col.formatter === 'function') {
        return null
      }
      return markRaw(toRaw(col.formatter))
    },
    getColumnBindProps(col) {
      // Exclude formatter, because a component-type formatter should not be passed to el-table-column's
      // formatter prop.
      // A function-type formatter has already been explicitly passed via :formatter.
      // But we need to keep formatter in v-bind so the template slot can access it,
      // so we don't exclude formatter here - it's handled inside el-data-table-column instead
      const { pinOriginalFixed, pinState, ...columnProps } = col
      return { align: this.columnsAlign, ...columnProps }
    },
    getQuery() {
      // Build the query object
      let query = {}
      let formValue = {}
      if (this.$refs.searchForm) {
        formValue = this.$refs.searchForm.getFormValue()
        Object.assign(query, formValue)
      }
      Object.assign(query, this._extraQuery)
      Object.assign(query, this.innerQuery)
      query[this.pageSizeKey] = this.hasPagination ? this.size : this.noPaginationSize

      // Compute the correct page number for the API based on the offset value
      const pageOffset = this.firstPage - defaultFirstPage
      query[this.pageKey] = this.hasPagination ? this.page + pageOffset : -1

      // Filter out invalid values, note that 0 is a valid value
      query = Object.keys(query)
        .filter((k) => !isFalsey(query[k]))
        .reduce((obj, k) => {
          obj[k] = query[k].toString().trim()
          return obj
        }, {})

      if (this.transformQuery) {
        query = this.transformQuery(query)
      }
      return query
    },
    getPageData() {
      return this.data
    },
    async gotoNextPage() {
      if (!this.hasNextPage()) {
        return false
      }
      this.page += 1
      await this.getList({ loading: true })
    },
    hasNextPage() {
      return this.page < this.lastPageNum
    },
    getList({ loading = true } = {}) {
      const { url } = this
      if (this.totalData) {
        return this.getListFromStaticData({ loading: true })
      }
      if (url) {
        return this.debouncedGetListFromRemote({ loading })
      }
      // this.$log.debug("last page is: ", this.lastPageNum)
    },
    filterTotalData() {
      const query = this.getQuery()
      const keyword = query.search || ''
      let totalData = this.totalData
      if (keyword) {
        totalData = totalData.filter((item) => {
          return Object.values(item).some((value) => {
            return value.toString().includes(keyword)
          })
        })
      }
      return totalData
    },
    getListFromStaticData({ loading = true } = {}) {
      if (loading) {
        this.tableLoading = true
      }
      // In static data (totalData) mode, the total is the data length. Must be set here,
      // because the totalData watcher only updates total when it "changes", and on initial mount
      // (totalData is already in place when created and doesn't change again) it won't fire, which
      // would cause pagination to show "0 total".
      this.total = this.totalData.length
      const totalData = this.filterTotalData()
      if (!this.hasPagination) {
        this.data = totalData
        this.tableLoading = false
        if (this.isTree) {
          this.data = this.tree2Array(this.data, this.expandAll)
        }
        return this.data
      }
      // page
      const pageOffset = this.firstPage - defaultFirstPage
      const page = this.page === 0 ? 1 : this.page
      const start = (page + pageOffset - 1) * this.size
      const end = (page + pageOffset) * this.size
      this.$log.debug(`page: ${page}, size: ${this.size}, start: ${start}, end: ${end}`)
      this.data = totalData.slice(start, end)
      this.tableLoading = false
      this.data = this.tree2Array(this.data, this.expandAll)
      return this.data
    },
    /**
     * Manually refresh the list data, default value of options is: { loading: true }
     * @public
     * @param {object} options method options
     */
    getListFromRemote({ loading = true } = {}) {
      const { url } = this
      if (!url) {
        return
      }

      const query = this.getQuery()
      let formValue = {}
      if (this.$refs.searchForm) {
        formValue = this.$refs.searchForm.getFormValue()
        Object.assign(query, formValue)
      }
      const queryStr = (url.indexOf('?') > -1 ? '&' : '?') + queryUtil.stringify(query, '=', '&')

      // Request starting
      this.tableLoading = loading

      // Store the query record, to make it easier to restore later
      if (this.saveQuery) {
        // The stored page is the table's page number, no offset needed
        query[this.pageKey] = this.page
        const newUrl = queryUtil.set(location.href, query, this.routerMode)
        history.replaceState(history.state, 'el-data-table search', newUrl)
      }

      const request = this.request || ((requestUrl, config) => this.$axios.get(requestUrl, config))
      Promise.resolve(request(url + queryStr, this.axiosConfig))
        .then(({ data: resp }) => {
          let data = []

          // Not paginated
          if (!this.hasPagination) {
            data = _get(resp, this.dataPath) || _get(resp, noPaginationDataPath) || []
            this.total = data.length
          } else {
            data = _get(resp, this.dataPath) || []
            // Return undefined when a value can't be obtained; el-pagination receiving null or
            // undefined causes no data to show but the next page to still be clickable
            this.total = _get(resp, this.totalPath) || 0
          }

          this.data = data

          // Tree structure logic
          if (this.isTree) {
            this.data = this.tree2Array(data, this.expandAll)
          }

          this.showNoData =
            this.$slots['no-data'] &&
            this.total === 0 &&
            (_isEmpty(formValue) || _values(formValue).every(isFalsey))

          this.tableLoading = false
          /**
           * Fired after the request returns and the data has been updated
           * @property {object} data - the table's data
           * @property {object} resp - the full response returned by the request
           */
          this.$emit('data-update', data, resp)

          // When persistSelection is enabled, the selected state needs to be synced to el-table
          this.$nextTick(() => {
            this.selectStrategy?.updateElTableSelection()
          })
        })
        .catch((err) => {
          /**
           * Request failed, returns the err object
           * @event error
           */
          this.$emit('error', err)
          this.total = 0
          this.tableLoading = false
        })
    },
    search(attrs, reset) {
      // Reset the search results to the first page
      this.page = defaultFirstPage
      // Orange reset the query object
      if (reset) {
        this.innerQuery = merge({}, attrs)
      } else {
        this.innerQuery = merge(this.innerQuery, attrs)
      }
      this.selected.splice(0, this.selected.length)
      return this.getList()
    },
    searchDate(attrs) {
      // Reset the search results to the first page
      this.page = defaultFirstPage
      this.innerQuery = merge(this.innerQuery, attrs)
      return this.getList()
    },

    /**
     * Reset the query, equivalent to clicking the "Reset" button
     *
     * @public
     */
    resetSearch() {
      // After reset, the values in the form become undefined, and will be assigned to query on the next query
      this.$refs.searchForm.resetFields()
      this.page = defaultFirstPage

      // Reset
      if (this.saveQuery) {
        const newUrl = queryUtil.clear(location.href)
        history.replaceState(history.state, '', newUrl)
      }

      /**
       * Fired after the reset button is pressed
       */
      this.$emit('reset')

      this.$emit('update:customQuery', JSON.parse(this.initExtraQuery))
      this.$emit('update:extraQuery', JSON.parse(this.initExtraQuery))

      this.$nextTick(() => {
        this.getList()
      })
    },
    handleSizeChange(val) {
      if (this.size === val) return
      this.$emit('update:page-size', val)
      this.$emit('sizeChange', val)
      this.page = defaultFirstPage
      this.size = val
      this.getList()
    },
    handleCurrentChange(val) {
      if (this.page === val) return
      this.$emit('update:current-page', val)
      this.page = val
      this.getList()
    },
    handleSelectAll(selection, selectable = () => true) {
      this.tableLoading = true
      try {
        this.selectStrategy.onSelectAll(selection, selectable)
      } finally {
        this.tableLoading = false
      }
    },
    /**
     * Toggle a row's selected state; if the second parameter is used, it sets whether the row is
     * selected or not
     *
     * @public
     * @param {object} row - the data row to update
     * @param {boolean} isSelected - whether it's checked
     */
    toggleRowSelection(row, isSelected) {
      return this.selectStrategy.toggleRowSelection(row, isSelected)
    },
    /**
     * Clear the multi-selection
     *
     * @public
     */
    clearSelection() {
      return this.selectStrategy?.clearSelection()
    },
    // Dialog related
    // Unless it's a tree structure and add is clicked in the operation column, row is a MouseEvent
    onDefaultNew(row) {
      // Suppress the default New method
      this.onNew()
    },
    onDefaultView(row) {
      this.row = row
      this.$refs.dialog.show(dialogModes.view, row)
    },
    onDefaultEdit(row) {
      this.row = row
      this.onEdit(row)
    },
    async onConfirm(isNew, formValue, done) {
      const data = {
        ...formValue,
        ...this._extraBody
      }

      if (this.isTree) {
        data[this.treeParentKey] = isNew
          ? this.row[this.treeParentValue]
          : this.row[this.treeParentKey]
      }

      try {
        await this.beforeConfirm(data, isNew)
        if (isNew) {
          await this.onNew(data, this.row)
        } else {
          await this.onEdit(data, this.row)
        }
        this.getList()
        this.onSuccess(isNew ? 'new' : 'edit', data)
        done()
      } catch (e) {
        // Don't close the dialog if there's an error
        done(false)
      }
    },
    /**
     * The complete delete method, with the following flow:
     * 1. Show a confirmation dialog (using deleteMessage);
     * 2. Execute onDelete, keeping the confirm button in a loading state during the process;
     * 3. On failure, report the error message and keep the dialog open;
     * 4. On success, report the success message, close the dialog, re-fetch the data, and correct the
     *    page number (see correctPage);
     * @public
     * @param {object|object[]} - the data object or array to delete
     */
    onDefaultDelete(data) {
      this.$confirm(this.deleteMessage(data), this.$t('Info'), {
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
        beforeClose: async (action, instance, done) => {
          if (action !== 'confirm') return done()

          instance.confirmButtonLoading = true

          try {
            await this.onDelete(data)
            done()
            this.onSuccess('delete', data)

            this.correctPage()
            this.getList()
          } catch (error) {
            console.warn(error.message)
            throw error
          } finally {
            instance.confirmButtonLoading = false
          }
        }
      }).catch(() => {
        /* cancelled */
      })
    },

    /**
     * Determine whether to go back to the previous page
     * @public
     */
    correctPage() {
      let deleteCount = 1
      if (this.hasSelect) {
        deleteCount = this.selected.length
        this.clearSelection()
      }
      const remain = this.data.length - deleteCount
      const lastPage = Math.ceil(this.total / this.size)
      if (remain === 0 && this.page === lastPage && this.page > defaultFirstPage) {
        this.page--
      }
    },

    // Tree table related
    // https://github.com/PanJiaChen/vue-element-admin/tree/master/@/components/TreeTable
    tree2Array(data, expandAll, parent = null, level = null) {
      let tmp = []
      data.forEach((record) => {
        if (record._expanded === undefined) {
          record._expanded = expandAll
        }
        let _level = 0
        if (level !== undefined && level !== null) {
          _level = level + 1
        }
        record._level = _level
        // If there's a parent element
        if (parent) {
          Object.defineProperty(record, 'parent', {
            value: parent,
            enumerable: false
          })
        }
        tmp.push(record)

        if (record[this.treeChildKey] && record[this.treeChildKey].length > 0) {
          const children = this.tree2Array(record[this.treeChildKey], expandAll, record, _level)
          tmp = tmp.concat(children)
        }
      })
      return tmp
    },
    rowClassName(...args) {
      let rcn = this.tableAttrs.rowClassName || this.tableAttrs['row-class-name'] || ''
      if (typeof rcn === 'function') rcn = rcn(...args)
      if (this.isTree) rcn += ' ' + this.showRow(...args)
      return rcn
    },
    showRow({ row }) {
      const show = !row.parent || (row.parent._expanded && row.parent._show)
      row._show = show
      return show ? 'row-show' : 'row-hide'
    },
    // Toggle whether children are expanded
    toggleExpanded(trIndex) {
      const record = this.data[trIndex]
      record._expanded = !record._expanded
    },
    // Icon display
    iconShow(index, record) {
      //      return index ===0 && record.children && record.children.length > 0;
      return record[this.treeChildKey] && record[this.treeChildKey].length > 0
    },
    onSortChange({ column, prop, order }) {
      if (!order) {
        delete this.innerQuery['sort']
        delete this.innerQuery['direction']
      } else {
        this.innerQuery['sort'] = prop
        this.innerQuery['direction'] = order
      }
      this.getList()
    }
  }
}
</script>
<style lang="scss" scoped>
// Custom styles
@use './index';

.el-data-table {
  $color-blue: #2196f3;
  $space-width: 18px;

  .ms-tree-space {
    position: relative;
    top: 1px;
    display: inline-block;
    font-style: normal;
    font-weight: 400;
    line-height: 1;
    width: $space-width;
    height: 14px;

    &::before {
      content: '';
    }
  }

  .tree-ctrl {
    position: relative;
    cursor: pointer;
    color: $color-blue;
  }

  .column-header-content {
    display: inline-flex;
    align-items: center;
  }

  .column-pin-button {
    position: absolute;
    top: 50%;
    right: 10px;
    transform: translateY(-50%);
    visibility: hidden;
    opacity: 0;
    padding: 2px 4px;
    border: 0;
    color: var(--el-text-color-placeholder);
    background: transparent;
    cursor: pointer;
    transition:
      opacity 0.15s ease,
      color 0.15s ease;

    i {
      transform: rotate(45deg);
    }

    &:hover {
      color: var(--el-color-primary);
    }

    &.is-pinned {
      visibility: visible;
      opacity: 1;
      color: var(--el-color-primary);
    }
  }

  :deep(th:hover) .column-pin-button {
    right: 8px;
    visibility: visible;
    opacity: 1;
  }

  :deep(th .cell) {
    position: relative;
  }

  :deep(.column-header-content + .caret-wrapper),
  :deep(.column-header-content + .el-table__column-filter-trigger) {
    margin-left: 5px;
  }

  @media (hover: none) and (pointer: coarse) {
    .column-pin-button {
      width: 28px;
      height: 28px;
      padding: 0;
      visibility: visible;
      opacity: 0.55;
      border-radius: 4px;

      &:not(.is-pinned),
      &:not(.is-pinned):hover {
        color: var(--el-text-color-placeholder);
      }

      &:not(.is-pinned):active {
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }

      &.is-pinned {
        opacity: 1;
      }
    }
  }

  @media (max-width: 991px) {
    .column-pin-button {
      display: none;
    }
  }

  @keyframes treeTableShow {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  .row-show {
    animation: treeTableShow 1s;
  }

  .row-hide {
    display: none;
  }
}
</style>
