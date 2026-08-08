<template>
  <ElDatableTable
    v-bind="mergedTableConfig"
    ref="table"
    :class="rootClass"
    :style="rootStyle"
    @size-change="handleSizeChange"
    @data-update="onUpdate"
    v-on="iListeners"
  />
</template>

<script>
import { newURL } from '@/utils/common/index'
import { ObjectLocalStorage } from '@/utils/common/objectLocalStorage'
import { omitVueListeners, pickVueListeners } from '@/utils/vue'
import { mapGetters } from 'vuex'
import { default as ElDatableTable } from './compenents/el-data-table'

export default {
  name: 'DataTable',
  components: {
    ElDatableTable
  },
  inheritAttrs: false,
  props: {
    config: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    const userTableActions = this.config.tableActions || {}
    const objTableSize = new ObjectLocalStorage('tableSize')
    const pathName = newURL(this.config.url).pathname
    return {
      objTableSize: objTableSize,
      pathName: pathName,
      defaultConfig: {
        axiosConfig: {
          raw: 1,
          params: {
            display: 1,
            draw: 1
          }
        },
        extraQuery: {},
        defaultAlign: 'left',
        dataPath: 'results',
        totalPath: 'count',
        saveQuery: false, // disable saving query params in the path
        persistSelection: true, // selected items are not lost when switching pages
        hasEdit: userTableActions.hasEdit !== false, // has edit button
        hasDelete: userTableActions.hasDelete !== false,
        hasNew: false,
        buttonSize: 'mini',
        tableAttrs: {
          stripe: false, // striped table
          border: true, // table border
          fit: true, // width auto-fit,
          tooltipEffect: 'dark',
          rowClassName: ({ row }) => {
            const selected = this.dataTable.selected.find((item) => item.id === row.id)
            return selected ? 'selected-row' : ''
          }
        },
        extraButtons: userTableActions.extraButtons,
        onEdit: (row) => {
          const defaultOnEdit = (row) => {
            const routeName = userTableActions.editRoute
            this.$router.push({ name: routeName, params: { id: row.id } })
          }
          let onEdit = userTableActions.onEdit
          if (!onEdit) {
            onEdit = defaultOnEdit
          }
          return onEdit(row)
        },
        pageCount: 5,
        paginationLayout: 'total, sizes, prev, pager, next',
        paginationSize: objTableSize.get(pathName) || 15,
        paginationSizes: [15, 30, 50, 100],
        paginationBackground: true,
        transformQuery: (query) => {
          if (query.page && query.size) {
            const page = query.page > 0 ? query.page : 1
            const offset = (page - 1) * query.size
            const limit = query.size
            query.offset = offset
            query.limit = limit
            delete query['page']
            delete query['size']
          }
          if (query.sort) {
            let ordering = query.direction === 'descending' ? '-' : ''
            ordering += query.sort
            query.order = ordering
            delete query['sort']
            delete query['direction']
          }
          return query
        },
        theRowDefaultIsSelected: (row) => {
          return false
        }
      }
    }
  },
  computed: {
    mergedTableConfig() {
      const attrs = omitVueListeners(this.$attrs)
      delete attrs.class
      delete attrs.style
      return Object.assign({}, this.tableConfig, attrs)
    },
    rootClass() {
      return ['el-data-table', this.$attrs.class]
    },
    rootStyle() {
      return this.$attrs.style
    },
    iListeners() {
      return Object.assign({}, pickVueListeners(this.$attrs), this.tableConfig?.listeners)
    },
    dataTable() {
      return this.$refs.table
    },
    tableConfig() {
      const tableDefaultConfig = this.defaultConfig || {}
      // Note: must use Object.assign({}, ...) to generate a new object, not Object.assign(tableDefaultConfig, ...) directly,
      // otherwise it would mutate the reactive this.defaultConfig in place — and since this computed property also depends on this.defaultConfig,
      // it would form a self-triggering loop of "computed property modifying its own dependency", causing Maximum recursive updates.
      const tableAttrs = Object.assign({}, tableDefaultConfig.tableAttrs, this.config.tableAttrs)
      const config = Object.assign({}, tableDefaultConfig, this.config)
      config.tableAttrs = tableAttrs
      this.$log.debug('elTableConfig', config)
      return config
    },
    ...mapGetters({
      globalTableConfig: 'tableConfig'
    })
  },
  watch: {},
  methods: {
    getList() {
      const reload = () => {
        const table = this.$refs.table
        if (!table) {
          return
        }
        table.clearSelection()
        return table.getList()
      }

      if (this.$refs.table) {
        return reload()
      }
      return this.$nextTick(reload)
    },
    getData() {
      return this.$refs.table.data
    },
    searchDate(attrs) {
      return this.$refs.table.searchDate(attrs)
    },
    search(attrs, reset) {
      return this.$refs.table.search(attrs, reset)
    },
    getQuery() {
      return this.$refs.table.getQuery()
    },
    toggleRowSelection(row, isSelected) {
      return this.$refs.table.toggleRowSelection(row, isSelected)
    },
    onUpdate(data, response) {
      if (!Array.isArray(data)) {
        return
      }
      const theRowDefaultIsSelected = this.tableConfig.theRowDefaultIsSelected
      if (!theRowDefaultIsSelected || typeof theRowDefaultIsSelected !== 'function') {
        return
      }

      for (const row of data) {
        if (theRowDefaultIsSelected(row)) {
          this.toggleRowSelection(row, true)
        }
      }

      this.$emit('loaded')
    },
    handleSizeChange(val) {
      this.objTableSize.set(this.pathName, val)
    }
  }
}
</script>

<style lang="scss" scoped></style>
