<template>
  <el-button
    type="warning"
    plain
    class="reset-mfa-button"
    :disabled="disabled"
    :title="disabled && tip ? tip : $t('ResetMFAHelp')"
    @click="onClick"
  >
    {{ $t('ResetMFA') }}
  </el-button>
</template>

<script>
export default {
  props: {
    userId: {
      type: String,
      default: () => ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    // Tooltip shown instead of the help text while disabled (e.g. MFA not enabled)
    tip: {
      type: String,
      default: () => ''
    }
  },
  methods: {
    onClick() {
      const vm = this
      const url = `/api/v1/users/users/${this.userId}/mfa/reset/`
      const warnMsg = this.$t('ResetMFAWarningMsg')
      const warnTitle = this.$t('Info')
      const successMsg = this.$t('ResetMFAdSuccessMsg')
      this.$confirm(warnMsg, warnTitle, {
        type: 'warning',
        confirmButtonClass: 'el-button--warning',
        showCancelButton: true,
        beforeClose: async (action, instance, done) => {
          if (action !== 'confirm') return done()
          instance.confirmButtonLoading = true
          try {
            await vm.$axios.get(url)
            done()
            vm.$message.success(successMsg)
          } finally {
            instance.confirmButtonLoading = false
          }
        }
      }).catch(() => {})
    }
  }
}
</script>
