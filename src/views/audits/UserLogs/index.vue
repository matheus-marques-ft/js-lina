<template>
  <TabPage v-model:active-menu="config.activeMenu" :submenu="config.submenu">
    <template #title>
      <div>
        {{ Title }}
      </div>
    </template>
    <keep-alive>
      <component :is="config.activeMenu" />
    </keep-alive>
  </TabPage>
</template>

<script>
import { TabPage } from '@/layout/components'
import OnlineSessionList from '@/views/sessions/OnlineSession/OnlineSessionList.vue'
import LoginLogList from '@/views/audits/LoginLog/LoginLogList.vue'
import PasswordChangeLogList from '@/views/audits/PasswordChangeLogList.vue'
import OperateLogList from '@/views/audits/OperateLog/OperateLogList.vue'

export default {
  name: 'UserLogs',
  components: {
    TabPage,
    OnlineSessionList,
    LoginLogList,
    PasswordChangeLogList,
    OperateLogList
  },
  data() {
    return {
      config: {
        activeMenu: 'OnlineSessionList',
        submenu: [
          {
            title: this.$t('TabOnlineUsers'),
            name: 'OnlineSessionList'
          },
          {
            title: this.$t('TabLoginRecords'),
            name: 'LoginLogList'
          },
          {
            title: this.$t('TabPasswordChange'),
            name: 'PasswordChangeLogList'
          },
          {
            title: this.$t('TabEvents'),
            name: 'OperateLogList'
          }
        ]
      }
    }
  },
  computed: {
    Title() {
      return this.$t('MenuUserLogs')
    }
  },
  mounted() {
    // Route has no dynamic segment for this, so a `params.activeMenu` value never survives
    // navigation (doesn't land in the path, doesn't land in the URL at all) - query is what
    // actually arrives, and gives dashboard links a bookmarkable ?tab=... URL as a bonus.
    const requested = this.$route.query.tab
    if (this.config.submenu.some((item) => item.name === requested)) {
      this.config.activeMenu = requested
    }
  }
}
</script>

<style scoped></style>
