<template>
  <el-form v-bind="$attrs" ref="elForm" :model="value" class="el-form-renderer" @submit.prevent>
    <template v-for="item in innerContent" :key="item.id">
      <slot v-if="!isHidden(item)" :name="`id:${item.id}`" />
      <component
        :is="item.type === GROUP ? 'render-form-group' : 'render-form-item'"
        :data="item"
        :server-errors="serverErrors"
        :disabled="disabled || item.disabled"
        :item-value="value[item.id]"
        :options="options[item.id]"
        :readonly="readonly || item.readonly"
        :value="value"
        @update-value="updateValue"
      />
      <slot v-if="!isHidden(item)" :name="`$id:${item.id}`" />
    </template>
    <slot />
  </el-form>
</template>
<script>
import _clonedeep from 'lodash/cloneDeep'
import _isequal from 'lodash/isEqual'
import _set from 'lodash/set'
import { markRaw, provide } from 'vue'
import RenderFormGroup from './components/render-form-group.vue'
import RenderFormItem from './components/render-form-item.vue'
import transformContent from './util/transform-content'
import {
  collect,
  correctValue,
  mergeValue,
  transformInputValue,
  transformOutputValue
} from './util/utils'

const GROUP = 'group'
const FORM_RENDERER_KEY = Symbol('formRenderer')

export { FORM_RENDERER_KEY }

export default {
  name: 'ElFormRenderer',
  components: {
    RenderFormItem: markRaw(RenderFormItem),
    RenderFormGroup: markRaw(RenderFormGroup)
  },
  props: {
    content: {
      type: Array,
      required: true
    },
    serverErrors: {
      type: Object,
      default: () => ({})
    },
    disabled: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    },
    /**
     * The v-model value. Takes priority when passed in
     */
    form: {
      type: Object,
      default: undefined
    }
  },
  emits: ['input', 'update:form'],
  setup() {
    // Provide form renderer context to child components
    // This replaces $parent chain access
    const formRendererContext = {
      updateForm: null,
      setOptions: null,
      getElForm: null
    }
    provide(FORM_RENDERER_KEY, formRendererContext)
    return { formRendererContext }
  },
  data() {
    return {
      GROUP,
      /**
       * inputFormat makes the whole input mechanism a lot more complex. value has the following input paths:
       * 1. the passed-in form => processed by inputFormat
       * 2. updateForm => processed by inputFormat
       * 3. but the default in content can't go through inputFormat, because inputFormat needs to accept the whole value as a parameter
       * 4. when the component internally updates value, it doesn't go through inputFormat
       */
      value: {}, // form data object
      options: {},
      initValue: null
    }
  },
  computed: {
    // used for data-operation compatibility
    innerContent: ({ content }) => transformContent(content)
  },
  watch: {
    form: {
      handler(v, oldV) {
        if (!v || _isequal(v, oldV)) return
        this.setValueFromModel()
      },
      immediate: true,
      deep: true
    },
    innerContent: {
      handler(v) {
        this.options = collect(v, 'options')
        this.setValueFromModel()
        this.initValue = _clonedeep(this.value)
      },
      immediate: true
    },
    value: {
      handler(v, oldV) {
        if (!v || _isequal(v, oldV)) return
        this.$emit('input', transformOutputValue(v, this.innerContent))
        this.$emit('update:form', transformOutputValue(v, this.innerContent))
      }
      // deep: true, // should not be necessary
    }
  },
  mounted() {
    // Populate the provided context with actual methods
    this.formRendererContext.updateForm = this.updateForm
    this.formRendererContext.setOptions = this.setOptions
    this.formRendererContext.getElForm = () => this.$refs.elForm

    /**
     * Same as element: store initValue during the mounted phase
     * @see https://github.com/ElemeFE/element/blob/6ec5f8e900ff698cf30e9479d692784af836a108/packages/form/src/form-item.vue#L304
     */
    this.initValue = _clonedeep(this.value)
    this.$nextTick(() => {
      // proxy
      const methods = this.$refs.elForm.$options.methods || {}

      Object.keys(methods).forEach((item) => {
        if (item in this) return
        this[item] = this.$refs.elForm[item]
      })
      /**
       * Some components update the initial value to a valid one during the created phase, which triggers validate. Known cases so far:
       * - el-select updates the initial value from undefined to [] when multiple is enabled
       * @hack
       */
      this.clearValidate()
    })
  },
  methods: {
    validate(...args) {
      const result = this.$refs.elForm?.validate?.(...args)
      if (result && typeof result.then === 'function') {
        return result
          .then((value) => value)
          .catch((error) => {
            throw error
          })
      }
      return result
    },
    validateField(...args) {
      return this.$refs.elForm?.validateField?.(...args)
    },
    scrollToField(...args) {
      return this.$refs.elForm?.scrollToField?.(...args)
    },
    /**
     * Reset the form to its initial value
     *
     * @public
     */
    resetFields() {
      /**
       * Reasons for not using el-form's resetFields mechanism:
       * - el-form's resetFields ignores el-form-renderer's custom components
       * - el-form's resetFields doesn't trigger input & change events, so they can't be listened to
       * - bug1: https://github.com/FEMessage/el-data-table/issues/176#issuecomment-587280825
       * - bug2:
       *   0. suggest first adding // debug(v.name, oldV.name) in the watch.value listener
       *   1. open the basic example
       *   2. type 1 into the input whose label is name; the log at this point is: '1' ''
       *   3. click the reset button; the log now shows two entries: '1' '1', '' ''
       *   4. because _isequal(v, oldV), the v-model update wasn't triggered
       */
      this.value = _clonedeep(this.initValue)
      this.$nextTick(this.clearValidate)
    },
    setValueFromModel() {
      if (!this.innerContent.length) return
      /**
       * Only collect data from default when v-model isn't used
       * the default value can't take inputFormat into account
       * see the case in value-format.md. In that case, what should default be set to?
       */
      const newValue = this.form
        ? transformInputValue(this.form, this.innerContent)
        : collect(this.innerContent, 'default')
      correctValue(newValue, this.innerContent)
      if (!_isequal(this.value, newValue)) this.value = newValue
    },
    /**
     * Update the form data
     * @param  {String} options.id form ID
     * @param  {All} options.value form data
     */
    updateValue({ id, value }) {
      this.value = { ...this.value, [id]: value }
    },
    /**
     * @return {object} key is item's id, value is item's value
     * @public
     */
    getFormValue() {
      return transformOutputValue(this.value, this.innerContent)
    },
    getInitialFormValue() {
      return transformOutputValue(_clonedeep(this.initValue || {}), this.innerContent)
    },
    /**
     * update form values
     * @param {object} newValue - key is item's id, value is the new value
     * @public
     */
    updateForm(newValue) {
      newValue = transformInputValue(newValue, this.innerContent)
      mergeValue(this.value, newValue, this.innerContent)
      this.value = { ...this.value }
    },
    /**
     * update select options
     * @param {string} id<br>
     * @param {array} options
     * @public
     */
    setOptions(id, options) {
      _set(this.options, id, options)
      this.options = { ...this.options } // Reassign to trigger a reactive update when setting options that didn't exist before
    },
    isHidden(item) {
      if (!item.el || !item.el['hiddenGroup']) {
        return false
      }
      if (item.hidden === true) {
        return true
      }
      if (typeof item.hidden === 'function') {
        return item.hidden(this.value)
      }
      return false
    },
    clearValidate() {
      return this.$refs.elForm?.clearValidate?.()
    }
  }
}
</script>
