<template>
  <div class="chart-container full-width">
    <el-row :gutter="16">
      <el-col :lg="12" :sm="24">
        <SummaryCountCard :config="logConfig" :items="LogItems" />
      </el-col>
      <el-col :lg="12" :sm="24">
        <SummaryCountCard :config="sessionConfig" :items="sessionItems" />
      </el-col>
    </el-row>
  </div>
</template>

<script>
import SummaryCountCard from '@/components/Dashboard/SummaryCountCard.vue'

export default {
  components: { SummaryCountCard },
  props: {
    days: {
      type: [Number, String],
      default: '7'
    }
  },
  data() {
    return {
      logConfig: {
        title: this.$t('LogData'),
        tip: this.$t('LogData')
      },
      sessionConfig: {
        title: this.$t('SessionData'),
        tip: this.$t('SessionData')
      },
      data: {
        total_count_user_login_logs: 0,
        total_count_operate_logs: 0,
        total_count_change_password_logs: 0,
        total_count_online_sessions: 0,
        total_count_history_sessions: 0,
        total_count_ftp_logs: 0
      }
    }
  },
  computed: {
    LogItems() {
      return [
        {
          title: this.$t('LoginNum'),
          body: {
            // Was `{ name: 'LoginLogList' }` - a leftover pointing at the old standalone
            // route (now hidden, /audit/audits/login-logs). The 3 resources live as tabs
            // inside "Logs de usuários" (AuditUserLogs) now; retarget there with the tab
            // name UserLogs/index.vue expects via params.activeMenu.
            route: { name: `AuditUserLogs`, params: { activeMenu: 'LoginLogList' } },
            count: this.data.total_count_user_login_logs,
            disabled: !this.$hasPerm('audits.view_userloginlog')
          }
        },
        {
          title: this.$t('OperationLogNum'),
          body: {
            route: { name: `AuditUserLogs`, params: { activeMenu: 'OperateLogList' } },
            count: this.data.total_count_operate_logs,
            disabled: !this.$hasPerm('audits.view_operatelog')
          }
        },
        {
          title: this.$t('DeclassificationLogNum'),
          body: {
            // Was `{ name: 'PasswordChangeLog' }` - wrong name too (the tab is
            // 'PasswordChangeLogList', see UserLogs/index.vue's submenu).
            route: { name: `AuditUserLogs`, params: { activeMenu: 'PasswordChangeLogList' } },
            count: this.data.total_count_change_password_logs,
            disabled: !this.$hasPerm('audits.view_passwordchangelog')
          }
        }
      ]
    },
    sessionItems() {
      return [
        {
          title: this.$t('OnlineSessions'),
          body: {
            route: { name: `SessionList`, params: { activeMenu: 'OnlineList' } },
            count: this.data.total_count_online_sessions,
            disabled: !this.$hasPerm('terminal.view_session')
          }
        },
        {
          title: this.$t('HistoricalSessionNum'),
          body: {
            route: {
              name: `SessionList`,
              params: { activeMenu: 'OfflineList' },
              query: { tab: 'OfflineList' }
            },
            count: this.data.total_count_history_sessions,
            disabled: !this.$hasPerm('terminal.view_session')
          }
        },
        {
          title: this.$t('FileTransferNum'),
          body: {
            route: { name: `FtpLog` },
            count: this.data.total_count_ftp_logs,
            disabled: !this.$hasPerm('audits.view_ftplog')
          }
        }
      ]
    }
  },
  watch: {
    days() {
      this.getData()
    }
  },
  mounted() {
    this.getData()
  },
  methods: {
    async getData() {
      this.data = await this.$axios.get(`/api/v1/index/?days=${this.days}
        &total_count_user_login_logs=1
        &total_count_operate_logs=1
        &total_count_change_password_logs=1
        &total_count_online_sessions=1
        &total_count_history_sessions=1
        &total_count_ftp_logs=1
      `)
    }
  }
}
</script>

<style scoped></style>
