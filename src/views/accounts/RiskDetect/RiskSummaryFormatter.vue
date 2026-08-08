<template>
  <span class="risk">
    <span v-for="[k, v] of Object.entries(cellValue)" :key="k">
      <el-tag v-if="v !== 0" :type="getRiskType(k)" effect="plain" size="small">
        {{ getRiskLabel(k) }}({{ v }})
      </el-tag>
    </span>
  </span>
</template>
<script>
import BaseFormatter from '@/components/Table/TableFormatters/base.vue'

export default {
  name: 'RiskSummaryFormatter',
  extends: BaseFormatter,
  props: {
    formatterArgsDefault: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      formatterArgs: Object.assign(this.formatterArgsDefault, this.col.formatterArgs),
      riskLabel: {
        zombie: 'Not used for a long time',
        ghost: 'Unmanaged',
        long_time_password: 'Password not changed for a long time',
        weak_password: 'Weak password',
        password_error: 'Password error',
        password_expired: 'Password expired',
        group_changed: 'Group changed',
        sudo_changed: 'Sudo privilege escalation',
        account_deleted: 'Account deleted',
        no_admin_account: 'No admin account',
        no_user_account: 'No user account',
        other: 'Other'
      },
      riskType: {
        zombie: 'warning',
        ghost: 'primary',
        long_time_password: 'warning',
        weak_password: 'danger',
        password_error: 'danger',
        password_expired: 'info',
        group_changed: 'warning',
        sudo_changed: 'warning',
        account_deleted: 'info',
        no_admin_account: 'warning',
        no_user_account: 'info',
        other: 'warning'
      }
    }
  },
  methods: {
    getRiskLabel(key) {
      return this.riskLabel[key.replace('_count', '')] || key
    },
    getRiskType(key) {
      return this.riskType[key.replace('_count', '')] || 'info'
    }
  }
}
</script>

<style lang="scss" scoped>
.risk {
  font-size: 12px;
  color: #1c84c6;

  .el-tag {
    margin-right: 2px;
  }
}
</style>
