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
            // AuditUserLogs's own path ('/audit/user-logs') has no dynamic segment, so a
            // `params` value here never lands anywhere - not in the path, not as a query
            // string, and $route.params.activeMenu comes back empty on navigation. Query is
            // the pattern that actually works (mirrors BaseList.vue's iNew.query.tab read);
            // also gives the bookmarkable ?tab=... URL shape that was asked for.
            route: { name: `AuditUserLogs`, query: { tab: 'LoginLogList' } },
            count: this.data.total_count_user_login_logs,
            disabled: !this.$hasPerm('audits.view_userloginlog')
          }
        },
        {
          title: this.$t('OperationLogNum'),
          body: {
            route: { name: `AuditUserLogs`, query: { tab: 'OperateLogList' } },
            count: this.data.total_count_operate_logs,
            disabled: !this.$hasPerm('audits.view_operatelog')
          }
        },
        {
          title: this.$t('DeclassificationLogNum'),
          body: {
            route: { name: `AuditUserLogs`, query: { tab: 'PasswordChangeLogList' } },
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
            route: { name: `SessionList`, query: { tab: 'OnlineList' } },
            count: this.data.total_count_online_sessions,
            disabled: !this.$hasPerm('terminal.view_session')
          }
        },
        {
          title: this.$t('HistoricalSessionNum'),
          body: {
            // Was also sending `params: { activeMenu: 'OfflineList' }` - dead weight, since
            // this route's path has no dynamic segment for it; query.tab is what SessionList
            // actually reads.
            route: { name: `SessionList`, query: { tab: 'OfflineList' } },
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
