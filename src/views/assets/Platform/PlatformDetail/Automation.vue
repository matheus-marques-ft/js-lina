<template>
  <IBox>
    <GenericCreateUpdateForm v-bind="$data" :object="object" class="form" />
  </IBox>
</template>

<script>
import IBox from '@/components/Common/IBox'
import { GenericCreateUpdateForm } from '@/layout/components'
import { platformFieldsMeta, setAutomations, updateAutomationParams } from '../const'
import { setUrlId } from '@/utils/common/index'
import { mapGetters } from 'vuex'

export default {
  components: {
    IBox,
    GenericCreateUpdateForm
  },
  props: {
    object: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    const canEdit = !this.object['internal'] && this.$hasPerm('assets.change_platform')
    return {
      loading: true,
      initial: {
        automation: {
          ansible_enabled: true
        }
      },
      url: '/api/v1/assets/platforms/',
      disabled: !canEdit,
      hasReset: false,
      hasDetailInMsg: false,
      submitMethod: () => 'patch',
      fields: [['', ['automation']]],
      fieldsMeta: platformFieldsMeta(this),
      onSubmit: this.submit,
      canSubmit: canEdit,
      defaultOptions: {},
      afterGetFormValue: (obj) => {
        updateAutomationParams(this, obj)
        return obj
      }
    }
  },
  computed: {
    ...mapGetters(['isSystemAdmin'])
  },
  async mounted() {
    try {
      await this.setDefaultAutomations()
    } finally {
      this.loading = false
    }
  },
  methods: {
    async setDefaultAutomations() {
      const { category, type } = this.object
      const url = `/api/v1/assets/categories/constraints/?category=${category.value}&type=${type.value}`
      this.defaultOptions = await this.$axios.get(url)
      await setAutomations(this)
    },
    submit(validValues) {
      if (!this.canSubmit || !this.isSystemAdmin) {
        return this.$message.error(this.$tc('NoPermission'))
      }
      const url = setUrlId(this.url, this.object.id)
      this.$axios.patch(url, validValues).then(() => {
        this.$message.success(this.$tc('UpdateSuccessMsg'))
      })
    }
  }
}
</script>

<style lang="scss" scoped>
:deep() {
  .el-cascader {
    width: 100%;
  }

  // Automation method row: the method dropdown fills the row (leaving space on the right
  // for the gear button); the params gear button is overlaid onto the far right of the
  // same method row via a negative margin. negative margin = method row height 30px +
  // FormItem spacing (--form-section-gap), which lands it precisely on the method row
  // without squeezing subsequent rows; bound to a CSS variable to fit the flex+gap layout.
  .item-method.el-form-item {
    .el-form-item__content {
      width: calc(100% - 50px) !important;
    }

    .el-select {
      width: 100%;
    }
  }

  .item-params.el-form-item {
    margin-top: calc(-30px - var(--form-section-gap, 20px));

    .el-form-item__label-wrap,
    .el-form-item__label {
      display: none;
    }

    .el-form-item__content {
      width: 100%;
      align-items: flex-end;
      padding-right: 10px;
    }
  }
}
</style>
