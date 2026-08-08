<template>
  <div class="filter-field jms-input-spacing" @click="handleFieldClick">
    <div ref="content" class="filter-field__content">
      <el-tag
        v-for="(v, k) in filterTags"
        :key="k"
        :disable-transitions="true"
        :type="tagType(v)"
        closable
        size="small"
        @click="handleTagClick(v, k)"
        @close="handleTagClose(v)"
      >
        {{ isCheckShowPassword ? changeTagShowValue(v) : v }}
      </el-tag>
      <div class="search-input-wrap">
        <component
          :is="component"
          ref="SearchInput"
          v-model.trim="filterValue"
          :fetch-suggestions="autocomplete"
          :placeholder="iPlaceholder"
          :trigger-on-focus="false"
          :type="inputType"
          class="search-input"
          @blur="handleBlur"
          @focus="handleFocus"
          @select="handleSelect"
          @keyup.enter.prevent="handleConfirm"
        />
      </div>
    </div>
    <span
      v-if="replaceShowPassword && filterTags.length > 0"
      class="show-password"
      @click="handleShowPassword"
    >
      <i :class="[isCheckShowPassword ? 'fa-eye-slash' : 'fa-eye']" class="fa" />
    </span>
    <span v-if="filterTags.length > 0" class="clear-icon" @click="handleClearAll">
      <el-icon :title="$t('Clear')"><CircleClose /></el-icon>
    </span>
  </div>
</template>

<script>
import i18n from '@/i18n/i18n'

function normalizeTags(value) {
  if (Array.isArray(value)) return value.slice()
  if (value === undefined || value === null || value === '') return []
  return [value]
}

export default {
  emits: ['input', 'change', 'update:modelValue', 'update:model-value'],
  props: {
    value: {
      type: [Array, String],
      default: () => []
    },
    modelValue: {
      type: [Array, String],
      default: undefined
    },
    tagType: {
      type: Function,
      default: () => {
        return 'info'
      }
    },
    placeholder: {
      type: String,
      default: () => i18n.t('Input')
    },
    autocomplete: {
      type: Function,
      default: null
    },
    replaceShowPassword: {
      type: Boolean,
      default: false
    },
    replaceRule: {
      type: String,
      default: ''
    },
    replaceContent: {
      type: String,
      default: '*'
    },
    inputType: {
      type: String,
      default: () => 'text'
    }
  },
  data() {
    return {
      focus: false,
      filterValue: '',
      filterTags: [],
      isCheckShowPassword: this.replaceShowPassword
    }
  },
  computed: {
    currentValue() {
      return this.modelValue !== undefined ? this.modelValue : this.value
    },
    iPlaceholder() {
      return `${this.placeholder} (${this.$t('EnterToContinue')})`
    },
    component() {
      return this.autocomplete !== null ? 'el-autocomplete' : 'el-input'
    }
  },
  watch: {
    // In Vue 3, data initializes before computed. Use an immediate watcher to
    // initialize uniformly once computed is available; both the first open and
    // subsequent external updates will sync the server value.
    currentValue: {
      handler(val) {
        this.filterTags = this.normalizeTags(val)
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    normalizeTags(value) {
      return normalizeTags(value)
    },
    emitTags(tags = this.filterTags) {
      const payload = this.normalizeTags(tags)
      // Sync the two-way binding first, then notify the change listener. The common
      // parent component pattern of `v-model + @change` reads the bound value inside
      // the change callback; if change fired first, it would still read the previous input.
      this.$emit('update:modelValue', payload)
      this.$emit('update:model-value', payload)
      this.$emit('input', payload)
      this.$emit('change', payload)
    },
    handleTagClose(tag) {
      this.filterTags = this.filterTags.filter((item) => item !== tag)
      this.emitTags()
    },
    handleSelect(item) {
      if (!this.autocomplete || typeof item?.value !== 'string') {
        return
      }
      this.filterValue = item.value
      this.handleConfirm()
    },
    // On blur, collect the uncommitted input into a tag; no longer auto-submit via a
    // debounced @change, otherwise el-input's change firing after every input would
    // split "123" into three tags 1/2/3.
    // The blur path does not refocus, avoiding the input stealing focus back when clicking elsewhere.
    handleBlur() {
      this.focus = false
      this.handleConfirm(false)
    },
    handleFocus() {
      this.focus = true
    },
    handleConfirm(refocus = true) {
      const value = this.filterValue.trim()
      if (value === '') return

      if (!this.filterTags.includes(value)) {
        this.filterTags = [...this.filterTags, value]
      }
      this.filterValue = ''
      this.emitTags()
      // keep focus after enter/select to allow continuous entry; don't steal focus back when submitting on blur
      if (refocus) {
        this.$refs.SearchInput?.focus()
      }
    },
    handleTagClick(v, k) {
      this.filterTags.splice(k, 1)
      this.filterValue = v
      this.$refs.SearchInput?.focus()
    },
    matchRule(value) {
      const regex = new RegExp(this.replaceRule)
      return value.replace(regex, (match, p1, p2, p3) => {
        const stars = p2.replace(/./g, this.replaceContent)
        return p1 + stars + p3
      })
    },
    changeTagShowValue(value) {
      if (this.replaceShowPassword && this.replaceRule) {
        value = this.matchRule(value)
      }
      return value
    },
    handleShowPassword() {
      this.isCheckShowPassword = !this.isCheckShowPassword
    },
    handleClearAll() {
      this.filterTags = []
      this.emitTags()
    },
    scrollInputIntoView() {
      const content = this.$refs.content
      if (content) {
        content.scrollLeft = content.scrollWidth
      }
    },
    handleFieldClick(event) {
      const target = event.target
      if (target?.closest?.('.el-tag, .clear-icon, .show-password')) {
        return
      }
      this.focusInput()
    },
    activateAutocomplete(input) {
      if (!this.autocomplete || !input) {
        return
      }
      if (input.activated && typeof input.activated === 'object') {
        input.activated.value = true
      } else {
        input.activated = true
      }
      input.getData?.(String(this.filterValue || ''))
    },
    focusInput() {
      const input = this.$refs.SearchInput
      this.scrollInputIntoView()
      input?.focus()
      this.$nextTick(() => {
        this.scrollInputIntoView()
        this.activateAutocomplete(input)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.el-tag + .el-tag {
  margin-left: 4px;
}

.filter-field {
  --jms-input-padding-block: 0;
  --jms-input-padding-inline: 11px;

  display: flex;
  align-items: center;
  width: 100%;
  min-height: 30px;
  height: auto;
  // The border is handled by this container; horizontal padding of the input text is uniformly handled by the inner wrapper (11px).
  padding: 0;
  box-sizing: border-box;
  border: 1px solid #dcdee2;
  border-radius: 1px;
  background-color: #fff;
  cursor: text;
  line-height: 1.4;
  overflow: hidden;

  &:hover {
    border-color: #c0c4cc;
  }

  .filter-field__content {
    display: flex;
    flex: 1 1 auto;
    flex-wrap: wrap;
    align-items: center;
    min-width: 0;
    overflow: visible;
  }

  & :deep(.el-tag) {
    flex: 0 0 auto;
    height: 24px;
    line-height: 22px;
    margin-top: 2px;
    margin-bottom: 2px;
    font-family: sans-serif !important;
    margin-left: 5px;
    padding: 0 8px;
  }

  & :deep(.el-input) {
    width: 100%;
    border: none !important;
    box-shadow: none !important;
    background: transparent;
  }

  & :deep(.el-input__wrapper) {
    min-height: 28px;
    height: 28px;
    border: none !important;
    background: transparent;
    box-shadow: none !important;
  }

  & :deep(.el-autocomplete) {
    height: 28px;
  }
}

.search-input-wrap {
  display: flex;
  flex: 1 1 180px;
  min-width: 80px;
  max-width: 100%;
}

.search-input {
  flex: 1 1 auto;
  min-width: 0;
  width: auto !important;
  max-width: 100%;
  border: none !important;
  box-shadow: none !important;

  & :deep(input.el-input__inner) {
    max-width: 100%;
    border: none !important;
    outline: none !important;
    appearance: none !important;
    -webkit-appearance: none !important;
    box-shadow: none !important;
    background: transparent !important;
    height: 28px;
    line-height: 28px;
  }

  & :deep(.el-input) {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }
}

.filter-field :deep(input.el-input__inner) {
  border: none !important;
  outline: none !important;
  appearance: none !important;
  -webkit-appearance: none !important;
  font-size: 13px;
  background: transparent !important;
}

.filter-field :deep(.el-input__suffix),
.filter-field :deep(.el-input__suffix-inner) {
  display: inline-flex;
  align-items: center;
  height: 28px;
}

.show-password {
  display: inherit;
  padding-right: 6px;
  cursor: pointer;

  &:hover {
    color: #999999;
  }
}

.clear-icon {
  display: inherit;
  padding-right: 6px;
  cursor: pointer;
  color: #c0c4cc;

  &:hover {
    color: #606164;
  }
}
</style>
