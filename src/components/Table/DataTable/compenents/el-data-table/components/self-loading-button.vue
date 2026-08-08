/* eslint-disable vue/require-prop-types */

<template>
  <component
    v-bind="$attrs"
    :is="isText ? 'text-button' : 'el-button'"
    :loading="loading"
    :type="type"
    @click="handleClick"
  >
    <slot />
  </component>
</template>

<script>
/* eslint-disable vue/require-default-prop */
/* eslint-disable vue/require-prop-types */
import TextButton from './text-button.vue'

export default {
  components: { TextButton },
  inheritAttrs: false,
  props: {
    /**
     * Whether this is a text button.
     */
    isText: {
      type: Boolean,
      default: false
    },
    /**
     * Without this prop, passing `type` via attrs would also change el-button's `native-type`
     */
    type: String,
    /**
     * The function bound to the button click
     */
    click: {
      type: Function
    },
    /**
     * Arguments for the click function
     */
    params: {},
    /**
     * Callback function for the click event
     */
    callback: {
      type: Function,
      default: () => {}
    }
  },
  data() {
    return {
      loading: false
    }
  },
  methods: {
    // Track the button's Promise progress
    handleClick() {
      if (!this.click) return

      this.loading = true
      Promise.resolve(this.click(this.params))
        .then((flag) => {
          if (flag === false) return
          // Call the data refresh method in the parent component
          this.callback()
        })
        .catch((e) => {})
        .finally((e) => {
          this.loading = false
        })
    }
  }
}
</script>
