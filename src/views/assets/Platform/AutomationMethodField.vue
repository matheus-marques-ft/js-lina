<template>
  <div class="automation-method">
    <el-select
      :disabled="disabled"
      :model-value="iValue"
      :placeholder="$t('Select')"
      class="automation-method__select"
      @change="onMethodChange"
    >
      <el-option v-for="opt in options" :key="opt.value" :label="opt.label" :value="opt.value" />
    </el-select>
    <AutomationParamsSetting
      class="automation-method__append"
      :disabled="disabled"
      :method="iValue"
      :title="paramsTitle"
      :url="paramsUrl"
      :value="currentParams"
      @input="onParamsInput"
    />
  </div>
</template>

<script>
import { inject } from 'vue'
import AutomationParamsSetting from './AutomationParamsSetting'
import { FORM_RENDERER_KEY } from '@/components/Form/DataForm/components/el-form-renderer/el-form-renderer.vue'

export default {
  name: 'AutomationMethodField',
  components: {
    AutomationParamsSetting
  },
  inheritAttrs: false,
  props: {
    // DataForm passes the current value via either :model-value or :value; either works
    modelValue: {
      type: [String, Number],
      default: ''
    },
    value: {
      type: [String, Number],
      default: ''
    },
    options: {
      type: Array,
      default: () => []
    },
    disabled: {
      type: Boolean,
      default: false
    },
    paramsTitle: {
      type: String,
      default: ''
    },
    paramsUrl: {
      type: String,
      default: '/api/v1/assets/platform-automation-methods/'
    },
    // The key of the sibling _params field, used to read back the saved params
    // from the form context (to prefill the dialog when editing)
    paramsKey: {
      type: String,
      default: ''
    },
    paramsValue: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['change', 'paramsChange'],
  setup() {
    // Inject the (automation sub-form's) form-renderer context, used to read back
    // the current value of the sibling _params field
    const formCtx = inject(FORM_RENDERER_KEY, { getElForm: null, updateForm: null })
    return { formCtx }
  },
  computed: {
    iValue() {
      return this.modelValue !== '' && this.modelValue != null ? this.modelValue : this.value
    },
    currentParams() {
      // The params field is now hidden and its value no longer comes through model-value,
      // so it's read back live from the current form value here, to ensure the dialog
      // can prefill the saved params when editing an existing platform.
      try {
        const model = this.formCtx?.getElForm?.()?.model
        if (model && this.paramsKey && model[this.paramsKey] != null) {
          return model[this.paramsKey]
        }
      } catch (e) {
        // ignore
      }
      return this.paramsValue || {}
    }
  },
  methods: {
    onMethodChange(val) {
      // Only emit change: DataForm's render-form-item will use it to update this
      // field's (_method) value, and trigger the field config's on.change
      // (e.g. the change_secret cascading effect).
      this.$emit('change', val)
    },
    onParamsInput(params) {
      // The params belong to the sibling _params field; a custom event lets the
      // field config's on.paramsChange write it back via updateForm, avoiding
      // direct mutation of the read-only form value.
      this.$emit('paramsChange', params)
    }
  }
}
</script>

<style lang="scss" scoped>
// The method dropdown + params-setting button are joined into an Element Plus
// input-group shape: dropdown on the left, gear button on the right, equal height,
// shared border, rounded corners only at the two ends (flat at the seam).
.automation-method {
  display: flex;
  align-items: stretch;
  width: 100%;
  min-height: 30px;
  gap: 12px;
}

.automation-method__select {
  flex: 1 1 auto;
  min-width: 0;

  :deep(.el-select__wrapper) {
    min-height: 30px;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
}

.automation-method__append {
  flex: 0 0 auto;
  display: flex;
  align-items: stretch;
}
</style>
