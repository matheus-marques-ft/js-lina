<template>
  <GenericCreateUpdatePage
    v-bind="$data"
    :create-success-next-route="successUrl"
    :update-success-next-route="successUrl"
  />
</template>

<script>
import { Required, RequiredChange } from '@/components/Form/DataForm/rules'
import TagInput from '@/components/Form/FormFields/TagInput.vue'
import GenericCreateUpdatePage from '@/layout/components/GenericCreateUpdatePage/index.vue'

export default {
  name: 'CommandStorageUpdate',
  components: {
    GenericCreateUpdatePage
  },
  data() {
    const commandType = this.$route.query.type || 'es'
    return {
      successUrl: { name: 'Storage', params: { activeMenu: 'CommandStorage' } },
      continueCleanFields: [
        'name',
        'meta.HOSTS',
        'meta.INDEX_BY_DATE',
        'meta.INDEX',
        'meta.IGNORE_VERIFY_CERTS',
        'is_default',
        'comment'
      ],
      initial: {
        type: commandType,
        doc_type: 'command',
        is_default: false,
        meta: {
          INDEX_BY_DATE: false,
          IGNORE_VERIFY_CERTS: false
        }
      },
      fields: [
        [this.$t('Basic'), ['name', 'type', 'meta']],
        [this.$t('Other'), ['is_default', 'comment']]
      ],
      fieldsMeta: {
        type: {
          type: 'select',
          disabled: true
        },
        meta: {
          fields: ['HOSTS', 'INDEX_BY_DATE', 'INDEX', 'IGNORE_VERIFY_CERTS'],
          fieldsMeta: {
            HOSTS: {
              component: TagInput,
              el: {
                replaceShowPassword: true,
                replaceRule: '(https?:\/\/[^:@]+:)([^@]+)(@.+)'
              },
              rules: [RequiredChange],
              helpText: this.$t('EsUrl'),
              helpTextAsPlaceholder: false
            },
            INDEX: {
              rules: [Required],
              helpText: this.$t('EsIndex')
            }
          }
        },
        comment: {
          component: 'el-input',
          el: {
            type: 'textarea'
          }
        }
      },
      getUrl() {
        const params = this.$route.params
        let url = '/api/v1/terminal/command-storages/'
        if (params.id) {
          url = `${url}${params.id}/`
        }
        return `${url}?type=${commandType}`
      },
      url: '/api/v1/terminal/command-storages/',
      hasDetailInMsg: false,
      afterGetFormValue(validValues) {
        if (!validValues?.meta?.HOSTS) {
          return validValues
        }
        return validValues
      },
      cleanFormValue(value) {
        value.meta.INDEX = value.meta?.INDEX?.toLowerCase()
        // Fixes the issue where, after the first submit fails, the HOSTS field is already an Array on resubmission
        if (typeof value.meta.HOSTS === 'string') {
          value.meta.HOSTS = value.meta.HOSTS.split(',').map((item) => item.trim())
        }
        return value
      }
    }
  }
}
</script>
