<template>
  <div class="update-token" :class="{ 'compound-field': isShow }">
    <el-button v-if="!isShow" icon="Edit" link @click="isShow = true">
      {{ text }}
    </el-button>
    <el-input
      v-else
      v-model.trim="curValue"
      :disabled="disabled"
      :placeholder="placeholder"
      :type="type"
      autocomplete="new-password"
      class="update-token__input jms-input-spacing"
      show-password
      @change="onChange"
    >
      <template #append>
        <button
          :disabled="disabled"
          class="update-token__refresh"
          type="button"
          @click="randomPassword"
        >
          <i class="fa fa-refresh" />
        </button>
      </template>
    </el-input>
  </div>
</template>

<script>
import { randomString } from '@/utils/common/index'

export default {
  props: {
    value: {
      type: String,
      default: () => ''
    },
    type: {
      type: String,
      default: () => 'password'
    },
    text: {
      type: String,
      default() {
        return 'Update'
      }
    },
    showInput: {
      type: Boolean,
      default: true
    },
    placeholder: {
      type: String,
      default: () => ''
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isShow: this.showInput,
      curValue: this.value
    }
  },
  created() {
    if (this.$route.path.indexOf('/update') !== -1) {
      this.isShow = false
    }
  },
  methods: {
    onChange(e) {
      this.$emit('input', this.curValue)
    },
    randomPassword() {
      this.curValue = randomString(24, true)
      this.$emit('input', this.curValue)
    }
  }
}
</script>
<style lang="scss" scoped>
.update-token {
  display: flex;
  align-items: center;
  width: 100%;

  // Expanded input state: the whole control is made into a single-border container
  // (the compound-field convention, the same one used by PhoneInput).
  // The container draws the only border ring; the inner input wrapper and append are
  // all borderless and merge into one, avoiding EP input-group's per-segment borders
  // stacking into "an independent gray button on the right".
  &.compound-field {
    height: 30px;
    box-sizing: border-box;
    border: 1px solid var(--el-border-color);
    border-radius: 0;
    background-color: #fff;
    overflow: hidden;

    &:hover {
      border-color: var(--el-border-color-hover);
    }

    // On focus, highlight the whole container border ring (rather than one segment); the refresh icon itself does not produce a highlight
    &:focus-within {
      border-color: var(--el-color-primary);
    }
  }

  :deep(.el-input) {
    width: 100%;
    height: 100%;
  }

  // The inner input wrapper has no border/box-shadow: the border is uniformly provided by the container
  :deep(.el-input__wrapper) {
    border: 0 !important;
    border-radius: 0;
    box-shadow: none !important;
  }

  // append (the refresh button) has no border, is transparent, and blends seamlessly with the input box
  :deep(.el-input-group__append) {
    padding: 0 2px;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    background-color: transparent;
  }
}

.update-token__input {
  flex: 1 1 auto;
  min-width: 0;
}

.update-token__refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 28px;
  padding: 0;
  border: 0;
  background-color: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  outline: none; // remove the native button's focus outline after click; the icon itself does not produce a highlight

  &:focus,
  &:focus-visible {
    outline: none;
  }

  &:hover {
    color: var(--color-primary);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  i {
    font-size: 14px;
  }
}
</style>
