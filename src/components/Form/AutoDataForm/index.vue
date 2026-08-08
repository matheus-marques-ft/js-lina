<template>
  <div>
    <DataForm
      v-bind="forwardedAttrs"
      v-if="!loading"
      ref="dataForm"
      :fields="totalFields"
      :form="iForm"
      :server-errors="serverErrors"
      @submit="handleSubmit"
      @invalid="handleInvalid"
    >
      <template v-for="(group, i) in groups" #[`id:${group.name}`]>
        <FormGroupHeader
          v-if="!groupHidden(group, i)"
          :key="'group-' + group.name"
          :group="group"
          :index="i"
          :line="i !== 0 && !groupHidden(groups[i - 1], i - 1)"
        />
      </template>
    </DataForm>
  </div>
</template>

<script>
import { getActionMeta } from '@/api/common'
import { FormFieldGenerator } from '@/components/Form/AutoDataForm/utils'
import { UniqueCheck } from '@/components/Form/DataForm/rules'
import FormGroupHeader from '@/components/Form/FormGroupHeader/index.vue'
import DataForm from '../DataForm/index.vue'

export default {
  name: 'AutoDataForm',
  components: {
    DataForm,
    FormGroupHeader
  },
  inheritAttrs: false,
  emits: ['submit', 'invalid', 'afterRemoteMeta', 'afterGenerateColumns'],
  props: {
    url: {
      type: String,
      required: true
    },
    method: {
      type: String,
      default: 'post'
    },
    fields: {
      type: Array,
      default: () => {
        return []
      }
    },
    form: {
      type: Object,
      default: () => ({})
    },
    fieldsMeta: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      remoteMeta: {},
      totalFields: [],
      loading: true,
      groups: [],
      errors: {},
      serverErrors: {}
    }
  },
  computed: {
    forwardedAttrs() {
      const attrs = { ...this.$attrs }
      delete attrs.onSubmit
      delete attrs.onInvalid
      return attrs
    },
    dataForm() {
      return this.$refs.dataForm
    },
    iForm() {
      const iForm = {}
      Object.entries(this.form).forEach(([key, value]) => {
        // The initial value is a choice object
        if (value && typeof value === 'object' && value.label && value.value !== undefined) {
          iForm[key] = value.value
        } else if (
          Array.isArray(value) &&
          value.length > 0 &&
          typeof value[0] === 'object' &&
          value[0].label &&
          value[0].value !== undefined
        ) {
          iForm[key] = value.map((item) => item.value)
        } else {
          iForm[key] = value
        }
      })
      return iForm
    }
  },
  mounted() {
    // this.$log.debug('>>> Method: ', this.method)
    this.optionUrlMetaAndGenerateColumns()
  },
  methods: {
    handleSubmit(...args) {
      this.$emit('submit', ...args)
    },
    handleInvalid(...args) {
      this.$emit('invalid', ...args)
    },
    async optionUrlMetaAndGenerateColumns() {
      let data = { actions: {} }
      if (this.url) {
        data = await this.$store.dispatch('common/getUrlMeta', { url: this.url })
      }
      this.remoteMeta = getActionMeta(data, this.method)
      this.$emit('afterRemoteMeta', this.remoteMeta)
      this.generateColumns()
      this.$emit('afterGenerateColumns', this.totalFields)
      this.cleanFormValue()
      // Clear errors on initialization
      this.serverErrors = {}
      this.loading = false
    },
    generateColumns() {
      const generator = new FormFieldGenerator()
      this.totalFields = generator.generateFields(this.fields, this.fieldsMeta, this.remoteMeta)
      this.groups = generator.groups
      this.$log.debug('Total fields: ', this.totalFields)
      this.applyUniqueRules()
    },
    applyUniqueRules() {
      const fields = this.totalFields || []
      const currentIdGetter = () => {
        return this.$route?.params?.id || this.form?.id || this.iForm?.id
      }

      // Strip the params appended after the url
      const defaultListUrl = (() => {
        try {
          const u = new URL(this.url, location.origin)
          u.pathname = u.pathname.replace(
            /\/(\d+|[0-9a-fA-F-]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12})\/?$/,
            '/'
          )
          return u.origin ? u.origin + u.pathname : u.pathname
        } catch (e) {
          return (this.url || '').replace(
            /\/(\d+|[0-9a-fA-F-]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12})\/?($|\?)/,
            '/$2'
          )
        }
      })()

      fields.forEach((field) => {
        const conf = field?.uniqueCheck

        if (!conf) return

        const confObj = typeof conf === 'object' ? conf : {}
        const param = confObj.param || field.prop || field.id
        const url = confObj.url || defaultListUrl
        const label = confObj.label || field.label || param
        const entityName = confObj.entityName || ''

        if (!Array.isArray(field.rules)) field.rules = []

        field.rules.push(
          UniqueCheck({
            url,
            param,
            label,
            entityName,
            getIgnoreId: currentIdGetter,
            fieldName: field.prop || field.id
          })
        )
      })
    },
    _cleanFormValue(form, remoteMeta) {
      if (!form) {
        form = {}
      }
      for (const [k, v] of Object.entries(remoteMeta)) {
        let valueSet = form[k]
        if (v.type === 'nested object' && v.children) {
          // Some fields have a nested object type but no children; fields without children don't need the recursive logic,
          // e.g. the attribute mapping field in authentication config
          if (typeof valueSet !== 'object') {
            // Handle cases where the frontend hasn't set an initial value
            valueSet = {}
          }
          form[k] = valueSet
          this._cleanFormValue(valueSet, v.children)
        }
        if (valueSet !== undefined) {
          continue
        }
        if (v.default === undefined) {
          continue
        }
        form[k] = v.default
      }
    },
    cleanFormValue() {
      this._cleanFormValue(this.iForm, this.remoteMeta)
    },
    _getElFormInstance() {
      try {
        return this.$refs?.dataForm?.$refs?.form?.$refs?.elForm || null
      } catch (e) {
        return null
      }
    },
    /**
     * @description Only clears the UI error display, without triggering a rebuild of the form content
     */
    clearAllFieldErrors() {
      const elForm = this._getElFormInstance()
      if (elForm && Array.isArray(elForm.fields)) {
        elForm.fields.forEach((item) => {
          item.validateMessage = ''
          item.validateState = ''
        })
      }
      // Don't modify totalFields/attrs, to avoid triggering a content rebuild that would lose input
      this.serverErrors = {}
    },
    setFieldError(name, error) {
      error = (error || '').toString().replace(/[。.]+$/, '')
      const elForm = this._getElFormInstance()
      if (elForm && Array.isArray(elForm.fields)) {
        const item = elForm.fields.find((f) => f.prop === name)
        if (item) {
          item.validateMessage = error
          item.validateState = error ? 'error' : ''
        }
      }
      // Don't write to totalFields, to avoid triggering an innerContent change that would overwrite the form value
      this.serverErrors = {
        ...this.serverErrors,
        [name]: error
      }
    },
    setErrors(errors) {
      const mapped = {}
      Object.entries(errors || {}).forEach(([k, v]) => {
        let msg = v
        console.log(k, v)
        // If v is an array and all elements are strings, join them into a string
        if (Array.isArray(v) && v.every((item) => typeof item === 'string')) msg = v.join('; ')
        // Handle cases like [{"port":["Please make sure this value is less than or equal to 65535."]},{},{}]
        else if (Array.isArray(v) && v.every((item) => _.isPlainObject(item))) {
          const subMsg = []
          v.forEach((subItem) => {
            Object.values(subItem).forEach((subMsgArr) => {
              if (Array.isArray(subMsgArr)) {
                subMsg.push(...subMsgArr)
              }
            })
          })
          msg = subMsg.join(' ')
        } else if (typeof v === 'object' && v !== null) msg = JSON.stringify(v)
        mapped[k] = String(msg || '')
      })
      this.serverErrors = mapped
      const elForm = this._getElFormInstance()
      if (elForm && Array.isArray(elForm.fields)) {
        elForm.fields.forEach((item) => {
          const msg = mapped[item.prop] || ''
          item.validateMessage = msg
          item.validateState = msg ? 'error' : ''
        })
      }
    },
    groupHidden(group, i) {
      for (const field of group.fields) {
        let hidden = field.hidden
        if (typeof hidden === 'function') {
          hidden = hidden(this.iForm)
        }
        if (!hidden) {
          return false
        }
      }
      return true
    }
  }
}
</script>
