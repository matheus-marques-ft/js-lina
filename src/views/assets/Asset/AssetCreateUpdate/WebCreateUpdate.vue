<template>
  <BaseAssetCreateUpdate v-bind="$data" />
</template>

<script>
import BaseAssetCreateUpdate from './BaseAssetCreateUpdate'
import Select2 from '@/components/Form/FormFields/Select2.vue'

export default {
  name: 'WebCreateUpdate',
  components: { BaseAssetCreateUpdate },
  data() {
    return {
      url: '/api/v1/assets/webs/',
      addFields: [
        [
          this.$t('Selector'),
          ['autofill', 'username_selector', 'password_selector', 'submit_selector', 'script'],
          1
        ],
        [
          this.$t('RemoteHost'),
          ['applet_balance', 'applet_host', 'applet_excluded_hosts'],
          5
        ]
      ],
      updateInitial(initial) {
        initial['applet_balance'] = true
        return initial
      },
      addFieldsMeta: {
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
        protocols: {
          hidden: (formValue) => {
            const address = formValue['address']
            if (!address) return
            let port = address.startsWith('https://') ? 443 : 80
            try {
              const url = new URL(address)
              if (url.port) {
                port = url.port
              }
            } catch (e) {
              // pass
            }
            const protocols = formValue['protocols']?.[0] || {}
            protocols.port = port
          }
        },
        username_selector: {
          hidden: (formValue) => formValue['autofill'] !== 'basic'
        },
        password_selector: {
          hidden: (formValue) => formValue['autofill'] !== 'basic'
        },
        submit_selector: {
          hidden: (formValue) => formValue['autofill'] !== 'basic'
        },
        script: {
          hidden: (formValue) => formValue['autofill'] !== 'script'
        }
      }
    }
  }
}
</script>

<style></style>
