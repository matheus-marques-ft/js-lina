<template>
  <BaseAssetCreateUpdate v-bind="$data" />
</template>

<script>
import BaseAssetCreateUpdate from './BaseAssetCreateUpdate'
import { UploadKey } from '@/components'
import rules from '@/components/Form/DataForm/rules'
import Select2 from '@/components/Form/FormFields/Select2.vue'

export default {
  name: 'DatabaseCreateUpdate',
  components: { BaseAssetCreateUpdate },
  data() {
    return {
      url: `/api/v1/assets/databases/`,
      addFields: this.getAddFields(),
      addFieldsMeta: this.getAddFieldsMeta(),
      updateInitial(initial) {
        initial['applet_balance'] = true
        return initial
      }
    }
  },
  methods: {
    getAddFields() {
      const platform = this.$context.get('type')
      const baseFields = [[this.$t('Basic'), ['db_name']]]
      let tlsFields = ['use_ssl', 'ca_cert']
      const platformFieldsMap = {
        redis: ['client_cert', 'client_key'],
        postgresql: ['client_cert', 'client_key', 'pg_ssl_mode'],
        mysql: ['client_cert', 'client_key', 'allow_invalid_cert'],
        mongodb: ['client_key', 'allow_invalid_cert']
      }

      if (platformFieldsMap[platform]) {
        tlsFields = tlsFields.concat(platformFieldsMap[platform])
      }
      if (tlsFields.length > 2) {
        const secureField = [this.$t('Secure'), tlsFields, 2]
        baseFields.push(secureField)
      }
      baseFields.push([
        this.$t('RemoteHost'),
        ['applet_balance', 'applet_host', 'applet_excluded_hosts'],
        5
      ])
      return baseFields
    },
    getAddFieldsMeta() {
      const platform = this.$context.get('type')
      const fieldsMeta = {
        db_name: {
          label: this.$t('DefaultDatabase')
        },
        applet_balance: {
          label: this.$t('BalanceAcrossAppletHosts'),
          component: 'el-switch',
          helpText: this.$t('AppletHostRequiredWhenNotBalanced')
        },
        applet_host: {
          label: this.$t('AppletHost'),
          component: Select2,
          hidden: (form) => form.applet_balance !== false,
          el: {
            multiple: false,
            clearable: true,
            ajax: {
              url: '/api/v1/terminal/applet-hosts/',
              transformOption: (item) => ({ label: item.name, value: item.id })
            }
          }
        },
        applet_excluded_hosts: {
          label: this.$t('ExcludedAppletHosts'),
          component: Select2,
          el: {
            multiple: true,
            url: '/api/v1/terminal/applet-hosts/',
            ajax: {
              transformOption: (item) => ({ label: item.name, value: item.id })
            }
          }
        },
        use_ssl: {
          label: this.$t('UseSSL'),
          component: 'el-switch',
          on: {
            change: ([event], updateForm) => {
              updateForm({
                pg_ssl_mode: event ? 'require' : 'prefer'
              })
            }
          }
        },
        allow_invalid_cert: {
          label: this.$t('AllowInvalidCert'),
          hidden: (form) => {
            return !form.use_ssl
          },
          component: 'el-switch'
        },
        ca_cert: {
          label: this.$t('CACertificate'),
          hidden: (form) => {
            return !form.use_ssl
          },
          component: UploadKey
        },
        client_cert: {
          label: this.$t('ClientCertificate'),
          hidden: (form) => {
            return !form.use_ssl
          },
          component: UploadKey
        },
        client_key: {
          label: this.$t('CertificateKey'),
          hidden: (form) => {
            return !form.use_ssl
          },
          component: UploadKey
        }
      }

      fieldsMeta['db_name']['rules'] = []
      if (['mongodb', 'oracle', 'postgresql'].indexOf(platform) !== -1) {
        fieldsMeta['db_name']['rules'] = [rules.Required]
      }
      if (platform === 'oracle') {
        fieldsMeta['db_name']['helpText'] = this.$t('OracleDBNameHelpText')
      }
      return fieldsMeta
    }
  }
}
</script>

<style></style>
