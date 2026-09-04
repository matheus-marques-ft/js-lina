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
    // value is write-only (never comes back on GET), so it can't be required on update - an
    // edit that doesn't touch it must be able to submit without it (see cleanFormValue below).
    // Same reasoning excludes clone: the real value is copied server-side from the source
    // secret (see SecretViewSet.perform_create), so requiring the user to type a throwaway one
    // here just to satisfy client-side validation would be confusing for no benefit.
    const isUpdate = this.$route.path.indexOf('/update') > -1
    const isClone = !!this.$route.query.clone_from
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
        source: {
          rules: [rules.Required]
        },
        name: {
          rules: [rules.Required]
        },
        value: {
          component: UpdateToken,
          rules: isUpdate || isClone ? [] : [rules.Required]
        },
        is_active: {
          type: 'checkbox'
        }
      },
      url: '/api/v1/keyvault/secrets/',
      createSuccessNextRoute: { name: 'SecretList' },
      updateSuccessNextRoute: { name: 'SecretList' },
      // value is write-only on the list/detail serializer (never returned by GET), so the
      // edit form always starts with an empty, collapsed UpdateToken widget - leaving it
      // untouched must NOT overwrite the stored value with a blank string. Required on a
      // genuine create (see fieldsMeta.value.rules above and SecretViewSet.perform_create on
      // the backend), so this only ever fires on update/clone, where an empty value means
      // "unchanged"/"copied server-side" rather than "missing".
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
