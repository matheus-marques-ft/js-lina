<template>
  <div class="password-input">
    <el-input
      ref="passwordInput"
      :model-value="modelValue"
      v-bind="inputAttrs"
      :show-password="showPassword"
      class="password-input__field"
      type="password"
      @blur="handleNativeBlur"
      @change="syncNativeValue"
      @focus="startNativeValueObserver"
      @update:model-value="handleInput"
    />
    <template v-if="showStrengthMeter">
      <div class="password-input__meter-wrap">
        <PasswordStrengthMeter
          ref="meter"
          v-bind="meterAttrs"
          v-model="modelValue"
          :strength-meter-only="true"
          class="password-input__meter"
          @feedback="handleFeedback"
          @score="handleScore"
        />
      </div>
    </template>
  </div>
</template>

<script>
import PasswordStrengthMeter from 'vue-password-strength-meter'
import 'vue-password-strength-meter/style.css'

export default {
  name: 'PasswordInput',
  components: {
    PasswordStrengthMeter
  },
  inheritAttrs: false,
  props: {
    value: {
      type: String,
      default: ''
    },
    attrs: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['feedback', 'input', 'score', 'update:modelValue'],
  data() {
    return {
      lastEmittedValue: this.value,
      nativeValueCheckTimer: null
    }
  },
  computed: {
    modelValue: {
      get() {
        return this.value
      },
      set(value) {
        this.handleInput(value)
      }
    },
    showPassword() {
      return this.attrs.toggle !== false
    },
    showStrengthMeter() {
      return !!this.attrs.showStrengthMeter
    },
    inputAttrs() {
      const {
        badge,
        defaultClass,
        disabledClass,
        errorClass,
        labelHide,
        labelShow,
        referenceValue,
        secureLength,
        showPassword,
        showStrengthMeter,
        strengthMeterClass,
        strengthMeterFillClass,
        strengthMeterOnly,
        successClass,
        toggle,
        userInputs,
        ...rest
      } = this.attrs || {}
      return rest
    },
    meterAttrs() {
      const {
        badge,
        defaultClass,
        disabledClass,
        errorClass,
        labelHide,
        labelShow,
        referenceValue,
        secureLength,
        showPassword,
        showStrengthMeter,
        strengthMeterClass,
        strengthMeterFillClass,
        successClass,
        toggle,
        userInputs
      } = this.attrs || {}

      return {
        badge,
        defaultClass,
        disabledClass,
        errorClass,
        labelHide,
        labelShow,
        referenceValue,
        secureLength,
        showPassword,
        showStrengthMeter,
        strengthMeterClass,
        strengthMeterFillClass,
        successClass,
        toggle,
        userInputs
      }
    }
  },
  watch: {
    value(value) {
      this.lastEmittedValue = value
    }
  },
  beforeUnmount() {
    this.clearNativeValueObserver()
  },
  methods: {
    clearNativeValueObserver() {
      if (this.nativeValueCheckTimer === null) {
        return
      }
      window.clearInterval(this.nativeValueCheckTimer)
      this.nativeValueCheckTimer = null
    },
    getNativeInput() {
      return this.$refs.passwordInput?.input
    },
    handleFeedback(value) {
      this.$emit('feedback', value)
    },
    handleInput(value) {
      this.lastEmittedValue = value
      // vue-password-strength-meter (strengthMeterOnly mode) only updates its own internal
      // `password` state via a `watch: { modelValue }` handler on ITS OWN prop - which never
      // fires for the initial mount value and, on every keystroke, lags one Vue reactive
      // flush behind our own state update. Setting its internal `password` ref directly here
      // (same field its own emitValue() writes to) keeps the meter's score perfectly in sync
      // with what was just typed, with no lag on the first character (or any character).
      //
      // NOT calling its emitValue() for this: emitValue() also does `this.$emit(...)`, and
      // since the <PasswordStrengthMeter> tag below is bound with v-model="modelValue", that
      // emit is caught by Vue's auto-generated v-model listener, which calls the modelValue
      // *setter* - i.e. this very handleInput() - again, synchronously, with the same value,
      // forever. That reentrant loop (a stack overflow) was the actual bug: it very plausibly
      // broke the reactive update entirely before anything could render, which looked exactly
      // like "the message never appears" - not a one-keystroke lag as originally guessed.
      if (this.$refs.meter) {
        this.$refs.meter.password = value
      }
      this.$emit('input', value)
      this.$emit('update:modelValue', value)
    },
    handleNativeBlur() {
      this.syncNativeValue()
      this.clearNativeValueObserver()
    },
    handleScore(value) {
      this.$emit('score', value)
    },
    startNativeValueObserver() {
      this.clearNativeValueObserver()
      this.syncNativeValue()
      this.nativeValueCheckTimer = window.setInterval(() => {
        this.syncNativeValue()
      }, 120)
    },
    syncNativeValue() {
      const value = this.getNativeInput()?.value
      if (typeof value !== 'string') {
        return
      }
      if (value === this.value || value === this.lastEmittedValue) {
        return
      }
      this.handleInput(value)
    }
  }
}
</script>

<style lang="scss" scoped>
.password-input {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 100%;
}

.password-input__field {
  width: 100%;
  max-width: 100%;
}

.password-input__meter-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 100%;
}

.password-input__meter-wrap :deep(.Password) {
  width: 100%;
  max-width: none;
  margin: 0;
}

// Segmented strength bar: track + white gaps at 20/40/60/80% split it into 5 segments
// (gaps provided by :before/:after); no overall pill border-radius/overflow:hidden is
// applied, otherwise it would blur into one continuous progress bar.
.password-input__meter-wrap :deep(.Password__strength-meter) {
  width: 100%;
  height: 6px;
  margin: 0;
  background: #ebeef5;
  border-radius: 2px;
}

.password-input__meter-wrap :deep(.Password__strength-meter:before),
.password-input__meter-wrap :deep(.Password__strength-meter:after) {
  height: 100%;
  border-color: #fff;
  border-width: 0 4px;
}

.password-input__meter-wrap :deep(.Password__strength-meter--fill) {
  border-radius: 2px;
}

.password-input__meter-wrap :deep(.Password__strength-meter--fill[data-score='0']) {
  background: var(--color-danger);
}

.password-input__meter-wrap :deep(.Password__strength-meter--fill[data-score='1']) {
  background: #ff7d5c;
}

.password-input__meter-wrap :deep(.Password__strength-meter--fill[data-score='2']) {
  background: var(--color-warning);
}

.password-input__meter-wrap :deep(.Password__strength-meter--fill[data-score='3']) {
  background: #7bc96f;
}

.password-input__meter-wrap :deep(.Password__strength-meter--fill[data-score='4']) {
  background: var(--color-success);
}
</style>
