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
import OnlineList from './OnlineList'
import OfflineList from './OfflineList'
import CommandList from '@/views/sessions/CommandList/BaseList.vue'

export default {
  name: 'Index',
  components: {
    TabPage,
    OnlineList,
    OfflineList,
    CommandList
  },
  data() {
    return {
      config: {
        activeMenu: 'OnlineList',
        submenu: [
          {
            title: this.$t('SessionOnline'),
            name: 'OnlineList'
          },
          {
            title: this.$t('SessionOffline'),
            name: 'OfflineList'
          },
          {
            title: this.$t('SessionCommands'),
            name: 'CommandList'
          }
        ]
      }
    }
  },
  computed: {
    Title() {
      return this.$t('Logs de sessão')
    }
  },
  mounted() {
    // This route's own path has no dynamic segment, so params.activeMenu never actually
    // arrives here - query.tab is what CardSummary.vue's dashboard links really send.
    const params = this.$route.query
    switch (params.tab) {
      case 'OnlineList':
        this.config.activeMenu = 'OnlineList'
        break
      case 'OfflineList':
        this.config.activeMenu = 'OfflineList'
        break
      case 'CommandList':
        this.config.activeMenu = 'CommandList'
        break
    }
  }
}
</script>

<style scoped></style>
