<template>
  <div>
    <GenericListPage ref="ListPage" :header-actions="headerActions" :table-config="tableConfig" />
    <SecretValueViewer
      v-if="showValueDialog"
      v-model:visible="showValueDialog"
      :row="viewedRow"
      :value="viewedValue"
    />
  </div>
</template>

<script>
import { GenericListPage } from '@/layout/components'
import { SwitchFormatter } from '@/components/Table/TableFormatters'
import SecretValueViewer from './SecretValueViewer.vue'

export default {
  name: 'SecretList',
  components: {
    GenericListPage,
    SecretValueViewer
  },
  data() {
    const vm = this
    return {
      showValueDialog: false,
      viewedRow: {},
      viewedValue: '',
      tableConfig: {
        url: '/api/v1/keyvault/secrets/',
        columnsShow: {
          min: ['name', 'actions'],
          default: [
            'source',
            'name',
            'expiration_date',
            'is_active',
            'is_expired',
            'created_by',
            'date_created',
            'actions'
          ]
        },
        columnsMeta: {
          is_expired: {
            width: '100px',
            formatterArgs: {
              showFalse: false,
              showText: false
            }
          },
          is_active: {
            formatter: SwitchFormatter,
            formatterArgs: {
              isDisplay(row) {
                return row.is_active
              },
              getPatchUrl(row) {
                return `/api/v1/keyvault/secrets/${row.id}/`
              },
              getPatchData(row) {
                return { is_active: !row.is_active }
              },
              callback() {
                vm.$refs.ListPage.reloadTable()
              }
            }
          },
          actions: {
            formatterArgs: {
              // ActionsFormatter's own defaults hardcode updateRoute:'GroupUpdate'/
              // cloneRoute:'GroupCreate' (leftover from the Users/Groups screen) - every
              // resource must override both explicitly or update/clone silently point at
              // the wrong screen.
              updateRoute: 'SecretUpdate',
              cloneRoute: 'SecretCreate',
              extraActions: [
                {
                  name: 'ViewValue',
                  title: vm.$t('View'),
                  can: vm.$hasPerm('keyvault.view_secretvalue'),
                  callback: async ({ row }) => {
                    if (vm.$store.getters.publicSettings?.SECURITY_DISABLE_VIEW_SECRET) {
                      vm.$message.warning(vm.$tc('AccountSecretReadDisabled'))
                      return
                    }
                    const res = await vm.$axios.get(`/api/v1/keyvault/secret-values/${row.id}/`)
                    vm.viewedRow = row
                    vm.viewedValue = res.value
                    vm.showValueDialog = true
                  }
                }
              ]
            }
          }
        }
      },
      headerActions: {
        createRoute: 'SecretCreate',
        hasRefresh: true,
        hasExport: false,
        hasImport: false
      }
    }
  }
}
</script>
