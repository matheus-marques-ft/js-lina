<template>
  <el-form-item
    v-bind="data.attrs"
    v-if="_show"
    :class="classes"
    :label="data.label"
    :prop="itemProp"
    :rules="_show && Array.isArray(data.rules) ? data.rules : []"
    :error="errorText"
  >
    <template v-if="data.label" #label>
      <span :title="data.label">
        <span v-if="data.required">* </span>
        {{ data.label }}
        <el-tooltip
          v-if="data.helpTip"
          :show-after="500"
          :tabindex="-1"
          effect="dark"
          placement="right"
          popper-class="help-tips"
        >
          <template #content>
            <div v-sanitize="data.helpTip" class="help-tip-content" />
          </template>
          <!-- Noncompliant -->
          <i class="fa fa-question-circle-o help-tip-icon" />
        </el-tooltip>
      </span>
    </template>
    <template v-if="readonly && hasReadonlyContent">
      <div
        v-if="data.type === 'input'"
        :style="componentProps.type === 'textarea' ? { padding: '10px 0', lineHeight: 1.5 } : ''"
      >
        {{ itemValue }}
      </div>
      <div v-else-if="data.type === 'select'">
        {{ multipleValue }}
      </div>
    </template>
    <component
      v-bind="componentProps"
      :is="rawComponent"
      v-else
      :disabled="disabled || componentProps.disabled || readonly"
      :model-value="itemValue"
      :value="valueProp"
      v-on="listeners"
    >
      <template v-for="opt in options" :key="opt.value">
        <el-option v-bind="opt" v-if="data.type === 'select'" />
        <el-checkbox-button
          v-bind="opt"
          v-else-if="data.type === 'checkbox-group' && data.style === 'button'"
          :label="'value' in opt ? opt.value : opt.label"
        >
          {{ opt.label }}
        </el-checkbox-button>

        <el-checkbox
          v-bind="opt"
          v-else-if="data.type === 'checkbox-group' && data.style !== 'button'"
          :label="'value' in opt ? opt.value : opt.label"
        >
          {{ opt.label }}
          <el-tooltip v-if="opt.tip" :content="opt.tip" :show-after="500" placement="top">
            <el-icon><Warning /></el-icon>
          </el-tooltip>
          <span v-if="data.helpText">{{ data.helpText }}</span>
        </el-checkbox>
        <!-- radio uses the value attribute to represent the selected value -->
        <!-- FYI: radio's value attribute can be used to bind to the same v-model even without a radio-group -->
        <el-radio
          v-bind="opt"
          v-else-if="data.type === 'radio-group'"
          :value="'value' in opt ? opt.value : opt.label"
        >
          {{ opt.label }}
          <el-tooltip v-if="opt.tip" :content="opt.tip" :show-after="500" placement="top">
            <el-icon><Warning /></el-icon>
          </el-tooltip>
        </el-radio>
      </template>
    </component>
    <div v-if="helpText" :class="data.type" class="help-block">
      <el-alert
        v-if="helpText.startsWith('!')"
        :closable="false"
        class="help-warning"
        show-icon
        type="info"
      >
        <span v-sanitize="helpText.replace(/^!/, '')" />
      </el-alert>
      <span v-else v-sanitize="helpText" />
    </div>
    <div v-if="data.helpTextFormatter" class="help-block">
      <RenderHelpTextSafe :render-content="data.helpTextFormatter" />
    </div>
  </el-form-item>
</template>
<script>
import _frompairs from 'lodash/fromPairs'
import _get from 'lodash/get'
import _includes from 'lodash/includes'
import _topairs from 'lodash/toPairs'
import { markRaw, toRaw, inject } from 'vue'
import { FORM_RENDERER_KEY } from '../el-form-renderer.vue'
import getEnableWhenStatus from '../util/enable-when'
import { noop } from '../util/utils'

function validator(data) {
  if (!data) {
    throw new Error('data must be an Object.')
  } else if (!data.id) {
    throw new Error('`id` is unvalidated.')
  } else if (!data.type && !data.component) {
    throw new Error('`type` and `component` cannot both be null.')
  }
}

export default {
  components: {
    RenderHelpTextSafe: {
      props: {
        renderContent: {
          type: Function,
          required: true
        }
      },
      render() {
        return this.renderContent()
      }
    }
  },
  props: {
    // eslint-disable-next-line vue/require-default-prop
    data: Object,
    serverErrors: {
      type: Object,
      default: () => ({})
    },
    prop: {
      type: String,
      default: ''
    },
    // eslint-disable-next-line vue/require-prop-types,vue/require-default-prop
    itemValue: {},
    // eslint-disable-next-line vue/require-default-prop
    value: Object,
    disabled: Boolean,
    readonly: Boolean,
    // eslint-disable-next-line vue/require-default-prop
    options: Array
  },
  emits: ['updateValue'],
  setup() {
    // Inject form renderer context to replace $parent chain access
    const formRendererContext = inject(FORM_RENDERER_KEY, {
      updateForm: null,
      setOptions: null,
      getElForm: null
    })
    return { formRendererContext }
  },
  data() {
    return {
      propsInner: {},
      isBlurTrigger:
        this.data.rules &&
        this.data.rules.some((rule) => {
          return rule.required && rule.trigger === 'blur'
        })
    }
  },
  computed: {
    helpText() {
      return typeof this.data.helpText === 'string' ? this.data.helpText : ''
    },
    itemProp() {
      return this.prop || this.data.id
    },
    rawComponent() {
      const comp = this.data.component || `el-${this.data.type}`
      return typeof comp === 'string' ? comp : markRaw(toRaw(comp))
    },
    valueProp() {
      if (this.data.type === 'checkbox') {
        return undefined
      }
      return this.itemValue
    },
    // The spread operator handles the undefined case
    componentProps: ({ data: { el }, propsInner }) => ({ ...el, ...propsInner }),
    hasReadonlyContent: ({ data: { type } }) => _includes(['input', 'select'], type),
    hiddenStatus: ({ data: { hidden = () => false }, data, value }) => hidden(value, data),
    enableWhenStatus: ({ data: { enableWhen }, value }) => getEnableWhenStatus(enableWhen, value),
    // Whether to show
    _show() {
      return !this.hiddenStatus && this.enableWhenStatus
    },
    classes() {
      return 'el-form-item-' + this.data.prop + ' ' + (this.data.attrs?.class || '')
    },
    errorText() {
      const fromAttrs = this.data?.attrs?.error
      const fromServer = this.serverErrors ? this.serverErrors[this.data.prop] : ''
      return fromAttrs || fromServer || ''
    },
    listeners() {
      const {
        data: {
          id,
          atChange = noop,
          on = {},
          on: { input: originOnInput = noop, change: originOnChange = noop } = {},
          trim = true
        }
      } = this
      // updateForm is only injected into the shared context by the parent el-form-renderer during its
      // mounted phase, and a child's mounted runs before its parent's. If updateForm were destructured
      // here it would capture the initial null, and since context is a plain (non-reactive) object,
      // a later assignment wouldn't cause this computed to re-evaluate. So it must be read from the
      // context at event-trigger time (call time) to guarantee getting the already-injected function.
      const getUpdateForm = () => this.formRendererContext.updateForm
      return {
        ..._frompairs(
          _topairs(on).map(([eName, handler]) => [
            eName,
            (...args) => handler(args, getUpdateForm())
          ])
        ),
        // Manually update the form data
        input: (value, ...rest) => {
          this.handleValueUpdate({
            id,
            value,
            rest,
            atChange,
            originInput: originOnInput,
            updateForm: getUpdateForm()
          })
        },
        'update:model-value': (value, ...rest) => {
          this.handleValueUpdate({
            id,
            value,
            rest,
            atChange,
            originInput: originOnInput,
            updateForm: getUpdateForm()
          })
        },
        'update:modelValue': (value, ...rest) => {
          this.handleValueUpdate({
            id,
            value,
            rest,
            atChange,
            originInput: originOnInput,
            updateForm: getUpdateForm()
          })
        },
        change: (value, ...rest) => {
          value = this.normalizeEmittedValue(value)
          if (typeof value === 'string' && trim) value = value.trim()
          this.$emit('updateValue', { id, value })
          originOnChange([value, ...rest], getUpdateForm())

          // FIXME: even though rules' trigger is set to blur only, validation still fires on change!
          this.triggerValidate(id)
        }
      }
    },

    multipleValue: ({ data, itemValue, options = [] }) => {
      const multipleSelectValue =
        _get(data, 'el.multiple') && Array.isArray(itemValue) ? itemValue : [itemValue]
      return multipleSelectValue
        .map((val) => (options.find((op) => op.value === val) || {}).label)
        .join()
    }
  },
  watch: {
    data: validator,
    /**
     * remote actually handles two things here. It could be split apart if there's an opportunity to.
     * 1. Basic usage: configure a url and a prop is fetched remotely and injected into the component
     * 2. For select, checkbox-group & radio-group components, the resp is treated directly as options; label & value exist specifically for this case
     */
    'data.remote': {
      handler(v, oldV) {
        if (!v) return
        if (oldV) {
          if (v.url === oldV.url || v.request === oldV.request) return
        }
        const isOptionsCase =
          ['select', 'checkbox-group', 'radio-group'].indexOf(this.data.type) > -1
        const {
          url,
          request = () => this.$axios.get(url).then((resp) => resp.data),
          prop = 'options', // Handles the el-cascader case by default
          dataPath = '',
          onResponse = (resp) => {
            if (dataPath) resp = _get(resp, dataPath)
            if (isOptionsCase) {
              return resp.map((item) => ({
                label: item[label],
                value: item[value]
              }))
            } else {
              return resp
            }
          },
          onError = (error) => console.error(error.message),
          label = 'label',
          value = 'value'
        } = v
        Promise.resolve(request())
          .then(onResponse, onError)
          .then((resp) => {
            if (isOptionsCase) {
              this.formRendererContext?.setOptions?.(this.itemProp, resp)
            } else {
              this.propsInner = { [prop]: resp }
            }
          })
      },
      immediate: true
    }
  },
  methods: {
    normalizeEmittedValue(value) {
      if (value && typeof value === 'object' && 'target' in value) {
        if (this.data.type === 'checkbox' && 'checked' in value.target) {
          return value.target.checked
        }
        if ('value' in value.target) {
          return value.target.value
        }
      }
      return value
    },
    handleValueUpdate({ id, value, rest = [], atChange = noop, originInput = noop, updateForm }) {
      value = this.normalizeEmittedValue(value)
      this.$emit('updateValue', { id, value })
      // Called when updating the form
      atChange(id, value)
      originInput([value, ...rest], updateForm)

      // FIXME: even though rules' trigger is set to blur only, validation still fires on input!
      this.triggerValidate(id)
    },
    triggerValidate(id) {
      if (!this.data.rules || !this.data.rules.length) return
      if (this.isBlurTrigger) return

      /**
       * Use the injected formRendererContext to get the ElForm instance
       * instead of the previous $parent chain access
       */
      const elForm = this.formRendererContext?.getElForm?.()
      if (!elForm) return

      this.$nextTick(() => {
        elForm.validateField(id)
      })
    }
  }
}
</script>
<style lang="scss" scoped>
.help-tips {
  opacity: 0.8;
  line-height: 2;
  width: 300px;
}

.help-block {
  :deep(.el-alert__icon) {
    font-size: 16px;
  }

  &.checkbox {
    //display: inline;
  }
}

/*
 * The el-alert (.help-warning) used for in-form tips has its font size/icon/padding aligned with
 * the page-level alert: 12px text, 16px icon, to avoid the in-form tip looking larger or inconsistently spaced.
 */
.help-block :deep(.help-warning) {
  padding: 8px 12px;

  .el-alert__icon,
  .el-alert__icon.is-big {
    width: 16px;
    height: 16px;
    font-size: 16px;
  }

  .el-alert__title,
  .el-alert__content,
  .el-alert__content span,
  .el-alert__content p {
    font-size: 12px !important;
    line-height: 1.5;
  }
}

.help-tip-icon {
  &:hover {
    cursor: pointer;
  }
}

.help-tip-content {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
