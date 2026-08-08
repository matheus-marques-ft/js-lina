<template>
  <Dialog
    v-bind="$attrs"
    v-if="visible"
    :visible="visible"
    :show-cancel="false"
    :show-confirm="false"
    :title="$tc('UpdateSelected')"
    top="1vh"
    min-width="720px"
    width="35%"
    @update:visible="$emit('update:visible', $event)"
  >
    <el-alert v-if="tips" class="tips" type="info">{{ tips }}</el-alert>
    <div class="select-prop">
      <span class="select-prop__label">{{ selectPropertiesLabel }}</span>
      <el-checkbox-group
        class="select-prop__group"
        :model-value="checkedFields"
        @change="handleCheckedFieldsChange"
        @update:model-value="checkedFields = $event"
      >
        <el-checkbox
          v-for="(value, name) in iFormSetting.fieldsMeta"
          :key="name"
          :disabled="value.disabled"
          :value="name"
        >
          {{ value.label || name }}
        </el-checkbox>
      </el-checkbox-group>
    </div>
    <el-row class="el-row-divider">
      <el-divider />
    </el-row>
    <el-row>
      <el-col :span="24">
        <GenericCreateUpdateForm
          v-bind="iFormSetting"
          :key="internalKey"
          label-width="90px"
          @after-remote-meta="handleAfterRemoteMeta"
        />
      </el-col>
    </el-row>
  </Dialog>
</template>

<script>
import Dialog from '@/components/Dialog'
import { GenericCreateUpdateForm } from '@/layout/components'

export default {
  name: 'GenericUpdateFormDialog',
  components: {
    Dialog,
    GenericCreateUpdateForm
  },
  props: {
    selectedRows: {
      type: Array,
      default: () => []
    },
    formSetting: {
      type: Object,
      default: () => ({})
    },
    tips: {
      type: String,
      default: ''
    },
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:visible', 'update', 'submitError'],
  data: function () {
    return {
      internalKey: 0,
      selectPropertiesLabel: this.$t('SelectProperties'),
      checkedFields: [],
      iFormSetting: {},
      originalHidden: {}
    }
  },
  watch: {
    visible: {
      immediate: true,
      handler(visible, oldVisible) {
        if (visible && !oldVisible) {
          this.initializeFormSetting()
        }
      }
    }
  },
  methods: {
    initializeFormSetting() {
      const defaultFormSetting = this.getDefaultFormSetting()
      const sourceFieldsMeta = this.formSetting.fieldsMeta || {}
      const fieldsMeta = {}
      const originalHidden = {}

      for (const [name, meta] of Object.entries(sourceFieldsMeta)) {
        fieldsMeta[name] = { ...meta }
        originalHidden[name] = meta.hidden
      }

      this.originalHidden = originalHidden
      this.checkedFields = Object.keys(fieldsMeta)
      this.iFormSetting = {
        ...defaultFormSetting,
        ...this.formSetting,
        fieldsMeta
      }
      this.internalKey++
    },
    handleAfterRemoteMeta(meta) {
      for (const [name, fieldMeta] of Object.entries(this.iFormSetting.fieldsMeta)) {
        const remoteLabel = meta?.[name]?.label
        if (remoteLabel) {
          fieldMeta.label = remoteLabel
        }
      }
    },
    handleCheckedFieldsChange(values) {
      for (const field of Object.keys(this.iFormSetting.fieldsMeta)) {
        if (values.indexOf(field) === -1) {
          this.iFormSetting.fieldsMeta[field].hidden = () => true
        } else {
          this.iFormSetting.fieldsMeta[field].hidden = this.originalHidden[field] || (() => false)
        }
      }
      this.internalKey++
    },
    getDefaultFormSetting() {
      const vm = this
      return {
        needGetObjectDetail: false,
        submitMethod: () => 'patch',
        cleanOtherFormValue: (formValue) => formValue,
        cleanFormValue: (value) => {
          const filterValue = {}
          Object.keys(value)
            .filter((key) => vm.checkedFields?.includes(key))
            .forEach((key) => {
              filterValue[key] = value[key]
            })
          let formValue = []
          let object = {}
          for (const row of vm.selectedRows) {
            object = Object.assign({}, filterValue, { id: row.id })
            formValue.push(object)
          }
          if (typeof this.iFormSetting.cleanOtherFormValue === 'function') {
            formValue = this.iFormSetting.cleanOtherFormValue(formValue)
          }
          return formValue
        },
        onSubmit: function (validValues) {
          const url = this.url
          const msg = this.$t(this.updateSuccessMsg)
          this.$axios
            .patch(url, validValues)
            .then((res) => {
              vm.$emit('update')
              this.$message.success(msg)
              vm.$emit('update:visible', false)
            })
            .catch((error) => {
              vm.$emit('submitError', error)
              const response = error.response
              const data = response.data
              // Do not set attrs.error on fields one by one, or change the fields reference.
              // Doing so would trigger a form content rebuild, overwriting/clearing what the user
              // already typed, and could result in only a single field error being shown.
              // Instead, use the setErrors(errors) exposed by AutoDataForm to set errors by overwriting:
              // - syncs directly to el-form-item.validateMessage in the UI
              // - supports showing multiple field errors at once
              // - does not modify the fields/attrs reference, avoiding input loss
              if (response.status === 400 && data && typeof data === 'object') {
                this.$refs.form.setErrors(data)
              }
            })
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// .el-row-divider {
// margin-bottom: 20px;
// }

.select-prop {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.select-prop__label {
  flex: 0 0 auto;
  line-height: 30px;
  color: var(--color-text-primary);
  white-space: nowrap;
}

.select-prop__group {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 24px;

  :deep(.el-checkbox) {
    height: 30px;
    margin: 0;
  }
}

.tips {
  margin-bottom: 10px;
}
</style>
