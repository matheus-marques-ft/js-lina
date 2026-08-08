<template>
  <div v-loading="loading">
    <AutoDataForm
      v-bind="$attrs"
      v-if="!loading"
      ref="form"
      :fields-meta="fieldsMeta"
      :form="form"
      :has-reset="iHasReset"
      :has-save-continue="iHasSaveContinue"
      :is-submitting="isSubmitting"
      :method="method"
      :url="iUrl"
      @after-remote-meta="handleAfterRemoteMeta"
      @submit="handleSubmit"
    />
  </div>
</template>
<script>
import { h } from 'vue'
import { ElLink } from 'element-plus'
import AutoDataForm from '@/components/Form/AutoDataForm'
import { getUpdateObjURL } from '@/utils/common/index'
import { encryptPassword } from '@/utils/secure'
import { getRuntimeActionMeta } from '@/libs/context/runtime'
import deepmerge from 'deepmerge'

export default {
  name: 'GenericCreateUpdateForm',
  components: {
    AutoDataForm
  },
  emits: [
    'afterRemoteMeta',
    'getObjectDone',
    'performError',
    'performFinished',
    'submitSuccess',
    'update:object'
  ],
  props: {
    // Address for creating the object
    url: {
      type: String,
      default: ''
    },
    // The object to update
    object: {
      type: Object,
      default: null
    },
    // Default value of the form
    initial: {
      type: Object,
      default: () => ({})
    },
    afterGetFormValue: {
      type: Function,
      default: (value) => value
    },
    // Clean up the form value before submitting
    cleanFormValue: {
      type: Function,
      default: (value) => value
    },
    fieldsMeta: {
      type: Object,
      default: () => ({})
    },
    omitUnchangedManyToMany: {
      type: Boolean,
      default: true
    },
    // Get meta
    afterGetRemoteMeta: {
      type: Function,
      default: null
    },
    // How to handle it when submitting
    onSubmit: {
      type: Function,
      default: null
    },
    hasReset: {
      type: Boolean,
      default: null
    },
    // How to submit the data
    performSubmit: {
      type: Function,
      default(validValues) {
        return this.$axios[this.method](this.iUrl, validValues)
      }
    },
    // Message for successful creation
    createSuccessMsg: {
      type: String,
      default: function () {
        return 'CreateSuccessMsg'
      }
    },
    // Message for saved successfully, continue adding
    saveSuccessContinueMsg: {
      type: String,
      default: function () {
        return 'SaveSuccessContinueMsg'
      }
    },
    // Message for successful update
    updateSuccessMsg: {
      type: String,
      default: function () {
        return 'UpdateSuccessMsg'
      }
    },
    // Route to navigate to after successful creation
    createSuccessNextRoute: {
      type: Object,
      default: function () {
        // const routeName = this.$route.name?.replace('Create', 'List')
        const routeName = 'GroupCreate'
        return { name: routeName }
      }
    },
    // Route to navigate to after successful update
    updateSuccessNextRoute: {
      type: Object,
      default: function () {
        // const routeName = this.$route.name?.replace('Update', 'List')
        const routeName = 'GroupUpdate'
        return { name: routeName }
      }
    },
    objectDetailRoute: {
      type: Object,
      default: function () {
        // const routeName = this.$route.name?.replace('Update', 'Detail').replace('Create', 'Detail')
        const routeName = 'GroupDetail'
        return { name: routeName }
      }
    },
    // Get the next route
    getNextRoute: {
      type: Function,
      default(res, method) {
        return { name: 'GroupList' }
        // return method === 'post' ? this.createSuccessNextRoute : this.updateSuccessNextRoute
      }
    },
    cloneNameSuffix: {
      type: [String, Number],
      default: function () {
        return 'Duplicate'.toLowerCase()
      }
    },
    // Get the submit method
    submitMethod: {
      type: [Function, String],
      default: null
    },
    // Get the URL function for create and update
    getUrl: {
      type: Function,
      default: function () {
        const objectId = this.getUpdateId()
        let url = this.url
        if (objectId) {
          url = getUpdateObjURL(url, objectId)
        }

        const clone_from = this.getCloneId()
        const query = clone_from ? `clone_from=${clone_from}` : ''
        if (query) {
          if (url.indexOf('?') === -1) {
            url = `${url}?${query}`
          } else {
            url = `${url}&${query}`
          }
        }
        return url
      }
    },
    extraQueryOrder: {
      type: String,
      default: '-date_updated'
    },
    emitPerformSuccessMsg: {
      type: Function,
      default(method, res, addContinue) {
        let msg = method === 'post' ? this.createSuccessMsg : this.updateSuccessMsg
        if (addContinue) {
          msg = this.saveSuccessContinueMsg
        }
        // These default values are original English keys (e.g. CreateSuccessMsg), translated here;
        // if the key is missing it's returned as-is, and callers passing already-translated text are unaffected.
        msg = this.$t(msg)
        let msgLinkName = ''
        if (res.name) {
          msgLinkName = res.name
        }
        const detailRoute = this.objectDetailRoute
        detailRoute.params = { id: res.id }
        if (this.hasDetailInMsg) {
          msg = msg[0].toLowerCase() + msg.slice(1)
          this.$message({
            message: h('p', null, [
              h(
                ElLink,
                {
                  onClick: () => this.$router.push(detailRoute),
                  style: { 'vertical-align': 'top', 'margin-right': '5px' }
                },
                () => msgLinkName
              ),
              h('span', {}, msg)
            ]),
            type: 'success'
          })
        } else {
          this.$message.success(msg)
        }
      }
    },
    onPerformSuccess: {
      type: Function,
      default(res, method, vm, addContinue) {
        const route = this.getNextRoute(res, method)
        if (!(route.params && route.params.id)) {
          route['params'] = deepmerge(route['params'] || {}, { id: res.id })
        }
        route['query'] = deepmerge(route['query'], {
          order: this.extraQueryOrder,
          updated: new Date().getTime()
        })

        this.$emit('submitSuccess', res)

        this.emitPerformSuccessMsg(method, res, addContinue)
        if (addContinue) {
          return
        }

        if (!vm.drawer) {
          if (this.$router.currentRoute.name !== route?.name) {
            setTimeout(() => this.$router.push(route), 100)
          }
        } else {
          this.$store.dispatch('common/finishDrawerActionMeta', { action: vm.action, row: res })
        }
      }
    },
    onPerformError: {
      type: Function,
      default(error, method, vm) {
        const response = error.response
        const data = response.data
        if (response.status === 400 && data && typeof data === 'object') {
          // Set the error map by overwriting, to avoid triggering a form content rebuild
          this.$refs.form.setErrors(data)
        }
        this.$emit('performError', data)
      }
    },
    hasSaveContinue: {
      type: Boolean,
      default: null
    },
    hasDetailInMsg: {
      type: Boolean,
      default: true
    },
    encryptedFields: {
      type: Array,
      default: () => ['password', 'token', 'private_key']
    },
    needGetObjectDetail: {
      type: Boolean,
      default: null
    }
  },
  data() {
    return {
      form: {},
      loading: true,
      isSubmitting: false,
      clone: false,
      drawer: false,
      action: '',
      actionId: '',
      row: {},
      method: 'post',
      initialFormValue: {}
    }
  },
  computed: {
    iUrl() {
      // The URL for updating or creating
      return this.getUrl()
    },
    iHasSaveContinue() {
      if (this.hasSaveContinue != null) {
        return this.hasSaveContinue
      }
      return this.method === 'post'
    },
    iHasReset() {
      if (this.hasReset != null) {
        return this.hasReset
      }
      return this.isUpdateMethod()
    }
  },
  async created() {
    this.loading = true
    this.$log.debug('Object init is: ', this.object, this.method)
    await this.setDrawerMeta()
    this.setMethod()
    // this.$log.debug('Set method: ', this.method, this.action)

    try {
      const values = await this.getFormValue()
      this.$log.debug('Final object is: ', values)
      const formValue = Object.assign(this.form, values)
      this.form = this.afterGetFormValue(formValue)
      this.initialFormValue = _.cloneDeep(this.form)
    } finally {
      this.loading = false
    }
  },
  methods: {
    async getDrawerMeta() {
      return getRuntimeActionMeta(this)
    },
    async setDrawerMeta() {
      const drawActionMeta = await this.getDrawerMeta()
      if (drawActionMeta && drawActionMeta.action) {
        this.drawer = true
        this.action = drawActionMeta.action
        this.row = drawActionMeta.row
        this.actionId = drawActionMeta.id || this.row?.id
      }
    },
    setMethod() {
      if (this.submitMethod instanceof Function) {
        this.method = this.submitMethod(this)
      } else {
        this.method = this.submitMethod
      }
      // this.$log.debug('Drawer: ', this.drawer, this.submitMethod, this.action)
      if (!this.drawer && !this.method) {
        this.method = this.$context.get('id') ? 'put' : 'post'
      }
      if (this.drawer && !this.submitMethod) {
        if (this.action === 'clone' || this.action === 'create') {
          this.method = 'post'
        } else {
          this.method = 'put'
        }
      }
    },
    getUpdateId() {
      if (this.actionId && this.action === 'update') {
        return this.actionId
      }
      return this.$context.get('id')
    },
    getCloneId() {
      if (this.actionId && this.action === 'clone') {
        return this.actionId
      }
      return this.$context.get('clone_from')
    },
    isUpdateMethod() {
      return ['put', 'patch'].indexOf(this.method.toLowerCase()) > -1
    },
    encryptFields(values) {
      // Batch submit; after cleaning it may be an array
      if (values instanceof Array) {
        return values.map((item) => this.encryptFields(item))
      }
      values = { ...values }
      for (const field of this.encryptedFields) {
        let value = values[field]
        if (!value || typeof value !== 'string') {
          continue
        }
        value = encryptPassword(value)
        values[field] = value
      }
      return values
    },
    handleAfterRemoteMeta(meta) {
      let result
      if (this.afterGetRemoteMeta) {
        result = this.afterGetRemoteMeta(meta)
      }
      this.$emit('afterRemoteMeta', meta)
      return result
    },
    handleSubmit(values, formName, addContinue) {
      let handler = this.onSubmit || this.defaultOnSubmit
      handler = handler.bind(this)
      values = this.cleanFormValue(values)
      const initialValues = formName?.getInitialFormValue?.() || this.initialFormValue
      values = this.removeUnchangedManyToManyFields(values, initialValues, formName)
      values = this.encryptFields(values)
      return handler(values, formName, addContinue)
    },
    normalizeManyToManyValue(value, valueKey = 'id') {
      const values = Array.isArray(value) ? value : value == null || value === '' ? [] : [value]
      const normalized = values
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return item
          }
          return item[valueKey] ?? item.value ?? item.id
        })
        .filter((item) => item !== undefined && item !== null && item !== '')
        .map((item) => String(item))
      return [...new Set(normalized)].sort()
    },
    getManyToManyFields(formInstance) {
      const fields = new Map(Object.entries(this.fieldsMeta))
      const collectFields = (items = []) => {
        items.forEach((item) => {
          if (!item || typeof item !== 'object') {
            return
          }
          const componentName = item.component?.name || item.component?.__name
          if (
            ['resourceSelect', 'treeResourceSelect'].includes(item.type) ||
            ['ResourceSelect', 'TreeResourceSelect'].includes(componentName)
          ) {
            fields.set(item.id || item.prop, item)
          }
          collectFields(item.fields || item.children || [])
        })
      }
      collectFields(formInstance?.innerContent)
      return fields
    },
    removeUnchangedManyToManyFields(values, initialValues = this.initialFormValue, formInstance) {
      if (!this.omitUnchangedManyToMany || !this.isUpdateMethod() || !values) {
        return values
      }

      const payload = { ...values }
      this.getManyToManyFields(formInstance).forEach((fieldMeta, fieldName) => {
        const componentName = fieldMeta?.component?.name || fieldMeta?.component?.__name
        const isRelationSelect =
          ['resourceSelect', 'treeResourceSelect'].includes(fieldMeta?.type) ||
          ['ResourceSelect', 'TreeResourceSelect'].includes(componentName)
        if (!isRelationSelect || !Object.prototype.hasOwnProperty.call(payload, fieldName)) {
          return
        }

        const valueKey = fieldMeta?.el?.valueKey || 'id'
        const initialValue = this.normalizeManyToManyValue(initialValues?.[fieldName], valueKey)
        const currentValue = this.normalizeManyToManyValue(payload[fieldName], valueKey)
        if (JSON.stringify(initialValue) === JSON.stringify(currentValue)) {
          delete payload[fieldName]
        }
      })
      return payload
    },
    defaultOnSubmit(validValues, formName, addContinue) {
      this.isSubmitting = true
      this.performSubmit(validValues)
        .then((res) => this.onPerformSuccess.bind(this)(res, this.method, this, addContinue))
        .catch((error) => this.onPerformError(error, this.method, this))
        .finally(() => {
          setTimeout(() => {
            this.isSubmitting = false
            this.$emit('performFinished')
          }, 200)
        })
    },
    async getCloneForm(cloneFrom) {
      const [curUrl, query] = this.url.split('?')
      const url = `${curUrl}${cloneFrom}/${query ? '?' + query : ''}`
      try {
        const object = await this.getObjectDetail(url)
        let name = ''
        let attr = ''
        if (object['name']) {
          name = object['name']
          attr = 'name'
        } else if (object['hostname']) {
          name = object['hostname']
          attr = 'hostname'
        }
        object[attr] = name + '-' + this.cloneNameSuffix.toString()
        return object
      } catch (e) {
        throw new Error(`Error for reason: ${e.message}`)
      }
    },
    async getFormValue() {
      let needGetObjectDetail = this.needGetObjectDetail
      if (needGetObjectDetail === null) {
        needGetObjectDetail = this.isUpdateMethod() || this.action === 'clone'
      }
      // this.$log.debug('Get form value: ', needGetObjectDetail, this.needGetObjectDetail, this.isUpdateMethod(), this.action)
      if (!needGetObjectDetail) {
        return Object.assign(this.form, this.initial)
      }
      let object = this.object

      if (!object || Object.keys(object).length === 0) {
        if (this.action === 'clone') {
          object = await this.getCloneForm(this.actionId)
        } else {
          object = await this.getObjectDetail(this.iUrl, this.actionId)
        }
      }
      if (object) {
        object = _.cloneDeep(object)
        this.$emit('update:object', object)
        this.$emit('getObjectDone', object)
      }
      return object
    },
    async getObjectDetail(url, id) {
      this.$log.debug('Get object detail: ', url)
      let data = await this.$axios.get(url, { params: { id } })
      if (Array.isArray(data)) {
        data = {}
      }
      return data
    }
  }
}
</script>

<style scoped></style>
