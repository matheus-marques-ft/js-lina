<template>
  <GenericDetailPage v-bind="config" v-model:active-menu="config.activeMenu" v-model:object="host">
    <keep-alive>
      <component :is="config.activeMenu" :object="host" />
    </keep-alive>
  </GenericDetailPage>
</template>

<script>
import { GenericDetailPage, TabPage } from '@/layout/components'
import Accounts from './Accounts'
import Applets from './Applets'
import Detail from './Detail'
import Developments from './Devployments'

export default {
  name: 'AssetHostDetail',
  components: {
    GenericDetailPage,
    Applets,
    TabPage,
    Detail,
    Accounts,
    Developments
  },
  data() {
    return {
      host: {},
      config: {
        // The applet host is also an asset; fetching via the asset API keeps this consistent with the asset detail display
        url: '/api/v1/assets/assets',
        activeMenu: 'Detail',
        submenu: [
          {
            title: this.$t('Basic'),
            name: 'Detail'
          },
          {
            title: this.$t('AssetAccount'),
            name: 'Accounts'
          },
          {
            title: this.$t('Applets'),
            name: 'Applets'
          },
          {
            title: this.$t('HostDeployment'),
            name: 'Developments'
          }
        ],
        hasRightSide: true,
        actions: {
          canDelete: this.$hasPerm('terminal.delete_applethost'),
          canUpdate: this.$hasPerm('terminal.change_applethost'),
          deleteSuccessRoute: 'Applets',
          updateRoute: () => {
            const platformId = this.host?.platform?.id || 'RemoteAppHost'
            return {
              name: 'AppletHostUpdate',
              params: { id: this.host.id },
              query: { platform: platformId }
            }
          }
        }
      }
    }
  },
  mounted() {}
}
</script>

<style scoped></style>
