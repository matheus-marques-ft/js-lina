<template>
  <div class="json-editor">
    <div class="json-editor-toolbar">
      <el-tooltip :content="$t('Format')" placement="top" :show-after="300">
        <button type="button" class="format-btn" @click="formatJson">
          <svg class="format-icon" viewBox="0 0 16 16" aria-hidden="true">
            <rect x="1" y="2.3" width="14" height="1.4" rx="0.7" />
            <rect x="4" y="6" width="11" height="1.4" rx="0.7" />
            <rect x="4" y="9.6" width="11" height="1.4" rx="0.7" />
            <rect x="1" y="13.3" width="14" height="1.4" rx="0.7" />
          </svg>
        </button>
      </el-tooltip>
    </div>
    <codemirror
      v-model="editorValue"
      :class="{ resize: resize === 'vertical' }"
      :extensions="extensions"
      :style="editorStyle"
      class="editor"
      @blur="handleBlur"
    />
  </div>
</template>

<script>
import { Codemirror } from 'vue-codemirror'
import { basicSetup } from 'codemirror'
import { StreamLanguage } from '@codemirror/language'
import { json } from '@codemirror/legacy-modes/mode/javascript'
import { markRaw } from 'vue'
import _isEqual from 'lodash/isEqual'

function stringifyValue(value) {
  if (typeof value === 'string') {
    return value
  }
  if (value === null || typeof value === 'undefined') {
    return ''
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch (error) {
    return ''
  }
}

export default {
  name: 'JsonEditor',
  components: {
    codemirror: Codemirror
  },
  props: {
    value: {
      // The JSON top level can be any valid value (array/object/string/number/boolean/null);
      // declaring only String|Object|Array would trigger a type warning when the user's input like 123/true is fed back in.
      type: [String, Object, Array, Number, Boolean],
      default: () => ({})
    },
    resize: {
      type: String,
      validator: (value) => ['none', 'vertical'].includes(value),
      default: 'vertical'
    }
  },
  // Declare input / update:modelValue: DataForm's render-form-item passes an input
  // handler through to each field component. If it's not declared in emits, Vue treats
  // onInput as a native DOM listener and attaches it to the root <div>, and since
  // CodeMirror's contenteditable bubbles a native input event on every keystroke,
  // the raw event object ends up written back as the field value (shown as
  // {"isTrusted":true,"_vts":...}). Declaring it makes Vue treat it as a component
  // event (this component never $emits it), so it's no longer passed through as a native listener.
  emits: ['change', 'input', 'update:modelValue'],
  data() {
    return {
      editorValue: stringifyValue(this.value),
      emitTimer: null,
      // This version's legacy-modes json/javascript export is already a StreamParser
      // object (not a function), passed directly to StreamLanguage.define; the JSON
      // editor uses json mode.
      // markRaw: CodeMirror 6's extension instances are deduplicated by object identity;
      // if wrapped by a Vue reactive Proxy, gutters like lineNumbers fail to dedupe and
      // render repeatedly (multiple line-number columns appear).
      extensions: markRaw([basicSetup, StreamLanguage.define(json)])
    }
  },
  computed: {
    editorStyle() {
      return {
        minHeight: '240px'
      }
    }
  },
  watch: {
    value: {
      deep: true,
      handler(newValue) {
        // If semantically equal, keep the user's hand-typed original text (including
        // line breaks/indentation) rather than overwriting it with the fed-back value.
        // Otherwise, after the user types "[\n]" and pauses, this component emits [],
        // the parent feeds back [] → stringified to "[]", which doesn't match the
        // "[\n]" text and gets overwritten, appearing as "auto-collapses to [] after a newline".
        try {
          if (_isEqual(this.parseEditorValue(), newValue)) {
            return
          }
        } catch (e) {
          // the current text is invalid JSON; fall through to the normal logic below and rewrite with the fed-back value
        }
        const nextValue = stringifyValue(newValue)
        if (nextValue !== this.editorValue) {
          this.editorValue = nextValue
        }
      }
    },
    editorValue() {
      this.queueEmit()
    }
  },
  beforeUnmount() {
    if (this.emitTimer) {
      clearTimeout(this.emitTimer)
    }
  },
  methods: {
    parseEditorValue() {
      if (!this.editorValue.trim()) {
        return {}
      }
      return JSON.parse(this.editorValue)
    },
    queueEmit() {
      if (this.emitTimer) {
        clearTimeout(this.emitTimer)
      }
      this.emitTimer = setTimeout(() => {
        try {
          this.$emit('change', this.parseEditorValue())
        } catch (error) {
          // It's normal for the text to be temporarily invalid while typing (e.g. just
          // typed half an object); silently skip it and don't pop a "format error" that
          // interrupts input — validate and prompt uniformly on blur (handleBlur) instead.
        }
      }, 300)
    },
    formatJson() {
      try {
        this.editorValue = JSON.stringify(this.parseEditorValue(), null, 2)
      } catch (error) {
        this.$message.error(this.$tc('FormatError'))
      }
    },
    handleBlur() {
      // On blur, only validate and submit — no longer auto-reformat, otherwise the
      // user's hand-typed "[\n]" line breaks etc. would collapse back to "[]" via
      // JSON.stringify. Use the toolbar's format button when tidying up is needed.
      if (!this.editorValue.trim()) {
        return
      }
      try {
        const parsed = this.parseEditorValue()
        this.$emit('change', parsed)
      } catch (error) {
        this.$message.error(this.$tc('FormatError'))
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.json-editor {
  // DataForm's .el-form-item__content is a flex column with align-items: flex-start,
  // so the cross axis doesn't stretch; the container must explicitly fill the width,
  // otherwise the CodeMirror editor's width would collapse.
  width: 100%;
  // The toolbar and editor form a single unit: the outer border is unified here, and inner child elements no longer each draw their own border.
  border: 1px solid #e5e6e7;
  border-radius: 4px;
  overflow: hidden;

  &:focus-within {
    border-color: var(--color-primary);
  }

  .json-editor-toolbar {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    height: 32px;
    padding: 0 8px;
    background-color: #f5f6f7;
    border-bottom: 1px solid #e5e6e7;

    .format-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      padding: 0;
      border: none;
      border-radius: 3px;
      background: transparent;
      cursor: pointer;
      // Use a concrete color value rather than a CSS variable, to avoid an unresolved variable making the icon "transparent" and only showing on hover.
      color: #606266;

      &:hover {
        background-color: #e9eaec;
        color: var(--color-primary);
      }

      .format-icon {
        width: 15px;
        height: 15px;
        fill: currentColor;
        display: block;
      }
    }
  }

  .resize :deep(.cm-editor) {
    resize: vertical;
    overflow: auto;
  }

  // Use a fixed height (rather than min-height): CodeMirror's .cm-gutters has its own
  // height:100%, which needs a parent with a defined height to resolve against. With
  // min-height, the scroller's height is determined by its content, so the gutter's
  // 100% can't resolve to the full height and the background only reaches the bottom
  // of the content, leaving blank space below. With a fixed height it fills completely;
  // overflowing content scrolls inside .cm-scroller, and resize: vertical still allows
  // manual dragging to a taller height.
  // The border is handled uniformly by the outer .json-editor, so no border is drawn here.
  :deep(.cm-editor) {
    height: 240px;
  }

  :deep(.cm-focused) {
    outline: none;
  }

  :deep(.cm-scroller) {
    font-family: Monaco, Menlo, Consolas, 'Courier New', monospace;
    font-size: 12px;
  }
}
</style>
