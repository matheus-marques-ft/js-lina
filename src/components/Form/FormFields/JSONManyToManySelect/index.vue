<template>
  <div class="json-m2m-select">
    <el-radio-group v-model="iValue.type" @change="handleTypeChange">
      <el-radio v-for="tp of types" :key="tp.name" :value="tp.name">
        {{ tp.label }}
      </el-radio>
    </el-radio-group>
    <ResourceSelect
      v-bind="select2"
      v-if="iValue.type === 'ids'"
      v-model="ids"
      :resource-name="resource"
      @change="onChangeEmit"
    />
    <div v-if="iValue.type === 'attrs'">
      <DataTable ref="attrTable" :config="tableConfig" class="attr-list" />
      <div class="actions">
        <el-button size="small" type="primary" @click="handleAttrAdd">
          {{ $t('Add') }}
        </el-button>
        <span style="padding-left: 10px; font-size: 13px">
          <span class="help-tips;">{{ $t('MatchedCount') }}:</span>
          <a class="text-link" style="padding: 0 5px" @click="showAttrMatchTable">{{
            attrMatchCount
          }}</a>
        </span>
      </div>
    </div>

    <AttrFormDialog
      v-if="attrFormVisible"
      v-model:visible="attrFormVisible"
      :attrs="attrs"
      :attrs-added="attrsAdded"
      :form="attrForm"
      @confirm="handleAttrDialogConfirm"
    />
    <AttrMatchResultDialog
      v-if="attrMatchTableVisible"
      v-model:visible="attrMatchTableVisible"
      :attrs="attrs"
      :url="attrMatchTableUrl"
    />
  </div>
</template>

<script>
import { attrMatchOptions } from '@/components/const'
import DataTable from '@/components/Table/DataTable/index.vue'
import { setUrlParam } from '@/utils/common/index'
import { toM2MJsonParams } from '@/utils/jms/index'
import { h, resolveComponent } from 'vue'
import cloneDeep from 'lodash/cloneDeep'
import isEqual from 'lodash/isEqual'
import ResourceSelect from '../ResourceSelect/index.vue'
import AttrFormDialog from './AttrFormDialog.vue'
import AttrMatchResultDialog from './AttrMatchResultDialog.vue'
import ValueFormatter from './ValueFormatter.vue'

const AttrActionFormatter = {
  name: 'AttrActionFormatter',
  props: {
    row: {
      type: Object,
      default: () => ({})
    },
    col: {
      type: Object,
      default: () => ({})
    },
    cellValue: {
      type: [String, Number, Boolean, Object, Array],
      default: null
    },
    index: {
      type: Number,
      default: 0
    }
  },
  methods: {
    trigger(handlerName) {
      const handler = this.col?.formatterArgs?.[handlerName]
      if (typeof handler !== 'function') {
        return
      }
      const next = handler({
        row: this.row,
        col: this.col,
        cellValue: this.cellValue,
        index: this.index
      })
      if (typeof next === 'function') {
        next()
      }
    }
  },
  render() {
    const ElButton = resolveComponent('el-button')
    return h('div', { class: 'input-button' }, [
      h(ElButton, {
        icon: 'Edit',
        size: 'small',
        style: { flexShrink: 0 },
        type: 'primary',
        onClick: () => this.trigger('onEdit')
      }),
      h(ElButton, {
        icon: 'Minus',
        size: 'small',
        style: { flexShrink: 0 },
        type: 'danger',
        onClick: () => this.trigger('onDelete')
      })
    ])
  }
}

export default {
  name: 'JSONManyToManySelect',
  components: {
    AttrActionFormatter,
    AttrFormDialog,
    AttrMatchResultDialog,
    DataTable,
    ResourceSelect
  },
  // The root node is a <div>. The parent (DataForm) binds listeners like
  // input/change/update:modelValue via v-on; by default Vue3 passes these through as
  // native DOM listeners on the root <div>. The internal el-radio-group's native radio
  // input/change events bubble up carrying target.value (e.g. "all"/"attrs"),
  // polluting the form value and causing the value prop to receive a String instead of
  // an Object, which throws an error.
  // inheritAttrs:false keeps these listeners only in $attrs and not bound to the root
  // node; the component updates the form value only via an explicit
  // $emit('input', object), completely preventing native event bubbling pollution.
  inheritAttrs: false,
  emits: ['input'],
  props: {
    value: {
      type: Object,
      default: () => {
        return {
          type: 'all'
        }
      }
    },
    select2: {
      type: Object,
      required: true
    },
    attrs: {
      type: Array,
      default: () => []
    },
    resource: {
      type: String,
      default: ''
    },
    attrTableColumns: {
      type: Array,
      default: () => ['name']
    }
  },
  data() {
    const initialValue = cloneDeep(this.value || { type: 'all' })
    const tableFormatter = (colName) => {
      return (row, col, cellValue) => {
        const value = cellValue
        switch (colName) {
          case 'name':
            return this.attrs.find((attr) => attr.name === value)?.label || value
          case 'match':
            return attrMatchOptions.find((opt) => opt.value === value).label || value
          case 'value':
            return Array.isArray(value) ? value.join(', ') : value
          default:
            return value
        }
      }
    }
    return {
      iValue: Object.assign({ type: 'all' }, initialValue),
      attrFormVisible: false,
      attrForm: {},
      attrMatchCount: 0,
      attrMatchTableVisible: false,
      attrMatchTableUrl: '',
      ids: Array.isArray(initialValue.ids) ? initialValue.ids : [],
      editIndex: -1,
      types: [
        { name: 'all', label: this.$t('All') + this.$t('WordSep') + this.resource.toLowerCase() },
        { name: 'ids', label: this.$t('Spec') + this.$t('WordSep') + this.resource.toLowerCase() },
        { name: 'attrs', label: this.$t('SelectByAttr') }
      ],
      tableConfig: {
        columns: [
          { prop: 'name', label: this.$t('AttrName'), formatter: tableFormatter('name') },
          { prop: 'match', label: this.$t('Match'), formatter: tableFormatter('match') },
          {
            prop: 'value',
            label: this.$t('AttrValue'),
            formatter: ValueFormatter,
            formatterArgs: { attrs: this.attrs }
          },
          {
            prop: 'action',
            label: this.$t('Action'),
            align: 'center',
            width: '120px',
            formatter: AttrActionFormatter,
            formatterArgs: {
              onEdit: this.handleAttrEdit,
              onDelete: this.handleAttrDelete
            }
          }
        ],
        totalData: Array.isArray(initialValue.attrs) ? initialValue.attrs : [],
        hasPagination: false
      }
    }
  },
  computed: {
    attrsAdded() {
      return this.tableConfig.totalData.map((item) => item.name)
    }
  },
  watch: {
    value: {
      deep: true,
      handler(value) {
        if (!isEqual(value, this.getCurrentValue())) {
          this.syncExternalValue(value)
        }
      }
    },
    attrFormVisible(val) {
      if (!val) {
        this.getAttrsCount()
      }
    }
  },
  mounted() {
    if (this.value.type === 'attrs') {
      this.getAttrsCount()
    }
    this.$emit('input', this.iValue)
  },
  methods: {
    getCurrentValue() {
      if (this.iValue.type === 'ids') {
        return { type: 'ids', ids: this.ids }
      }
      if (this.iValue.type === 'attrs') {
        return { type: 'attrs', attrs: this.tableConfig.totalData }
      }
      return { type: 'all' }
    },
    syncExternalValue(value) {
      const nextValue = cloneDeep(value || { type: 'all' })
      this.iValue = Object.assign({ type: 'all' }, nextValue)
      this.ids = Array.isArray(nextValue.ids) ? nextValue.ids : []
      this.tableConfig.totalData = Array.isArray(nextValue.attrs) ? nextValue.attrs : []
      if (nextValue.type === 'attrs') {
        this.$nextTick(() => {
          this.$refs.attrTable?.getList()
          this.getAttrsCount()
        })
      } else {
        this.attrMatchCount = 0
      }
    },
    showAttrMatchTable() {
      const [key, value] = this.getAttrFilterKey()
      this.attrMatchTableUrl = setUrlParam(this.select2.url, key, value)
      this.attrMatchTableVisible = true
    },
    getAttrFilterKey() {
      if (this.tableConfig.totalData.length === 0) return ''
      let attrFilter = { type: 'attrs', attrs: this.tableConfig.totalData }
      attrFilter = toM2MJsonParams(attrFilter)
      return attrFilter
    },
    getAttrsCount() {
      const attrFilter = this.getAttrFilterKey()
      if (!attrFilter) {
        this.attrMatchCount = 0
        return
      }
      const [key, value] = attrFilter
      let url = setUrlParam(this.select2.url, key, value)
      url = setUrlParam(url, 'limit', 1)
      return this.$axios.get(url).then((res) => {
        this.attrMatchCount = res.count
      })
    },
    handleAttrEdit({ row, index }) {
      return () => {
        this.attrForm = Object.assign({ index }, row)
        this.editIndex = index
        this.attrFormVisible = true
      }
    },
    handleAttrDelete({ index }) {
      return () => {
        this.tableConfig.totalData.splice(index, 1)
        this.getAttrsCount()
        this.onChangeEmit()
      }
    },
    handleAttrAdd() {
      this.attrForm = {}
      this.editIndex = -1
      this.attrFormVisible = true
    },
    onChangeEmit() {
      const tp = this.iValue.type
      this.handleTypeChange(tp)
    },
    handleTypeChange(val) {
      switch (val) {
        case 'ids':
          this.$emit('input', { type: 'ids', ids: this.ids })
          break
        case 'attrs':
          this.$emit('input', { type: 'attrs', attrs: this.tableConfig.totalData })
          break
        default:
          this.$emit('input', { type: 'all' })
          break
      }
    },
    handleAttrDialogConfirm(form) {
      if (this.editIndex > -1) {
        this.tableConfig.totalData.splice(this.editIndex, 1)
      }
      const allAttrs = this.tableConfig.totalData
      // since an attr's name may be duplicated, it needs to be removed before being added
      const setIndex = allAttrs.findIndex((attr) => attr.name === form.name)
      if (setIndex === -1) {
        allAttrs.push(Object.assign({}, form))
      } else {
        allAttrs.splice(setIndex, 1, Object.assign({}, form))
      }
      this.attrFormVisible = false
      this.onChangeEmit()
    }
  }
}
</script>

<style lang="scss" scoped>
// The root node must fill the width: the outer .el-form-item__content is a flex
// column with align-items:flex-start and won't auto-stretch block-level children;
// otherwise this component (radio + attribute table) would shrink to its content
// width instead of filling the form item's width.
.json-m2m-select {
  width: 100%;
}

.attr-list {
  width: 99%;
}
</style>
