<template>
  <GenericCreateUpdatePage v-bind="$data" />
</template>

<script>
import GenericCreateUpdatePage from '@/layout/components/GenericCreateUpdatePage'
import { UpdateToken } from '@/components/Form/FormFields'
import rules from '@/components/Form/DataForm/rules'

export default {
  name: 'SecretCreateUpdate',
  components: {
    GenericCreateUpdatePage
  },
  data() {
    return {
      initial: {
        is_active: true
      },
      fields: [
        [this.$t('Basic'), ['source', 'name', 'expiration_date']],
        [this.$t('Value'), ['value']],
        [this.$t('Other'), ['is_active', 'comment']]
      ],
      fieldsMeta: {
        name: {
          rules: [rules.Required]
        },
        value: {
          component: UpdateToken
        },
        is_active: {
          type: 'checkbox'
        }
      },
      url: '/api/v1/keyvault/secrets/',
      createSuccessNextRoute: { name: 'SecretList' },
      updateSuccessNextRoute: { name: 'SecretList' },
      // value is write-only on the list/detail serializer (never returned by GET), so the
      // clone/edit form always starts with an empty, collapsed UpdateToken widget - leaving
      // it untouched must NOT overwrite the stored value with a blank string. On create it's
      // legitimately optional (a Secret can be registered before its value is known).
      cleanFormValue(value) {
        if (!value.value) {
          delete value.value
        }
        return value
      },
      // encryptedFields (not manual encryptPassword() here) is the generic mechanism every
      // GenericCreateUpdateForm field goes through - see index.vue's encryptFields().
      encryptedFields: ['value'],
      getNextRoute(res, method) {
        return method === 'post' ? this.createSuccessNextRoute : this.updateSuccessNextRoute
      }
    }
  }
}
</script>
