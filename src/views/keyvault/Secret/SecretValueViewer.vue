<template>
  <Dialog
    :confirm-title="$t('Close')"
    :destroy-on-close="true"
    :show-cancel="false"
    :title="row.name"
    :visible="showDialog"
    width="600px"
    @confirm="close"
    @update:visible="close"
  >
    <el-form label-position="right" label-width="130px">
      <el-form-item :label="$t('Value')">
        <SecretViewerFormatter
          :cell-value="value"
          :col="{ formatterArgs: { name: row.name, secretFrom: 'cellValue', hasEdit: false } }"
        />
      </el-form-item>
    </el-form>
  </Dialog>
</template>

<script>
import Dialog from '@/components/Dialog/index.vue'
import { SecretViewerFormatter } from '@/components/Table/TableFormatters'

export default {
  name: 'SecretValueViewer',
  components: {
    Dialog,
    SecretViewerFormatter
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    row: {
      type: Object,
      default: () => ({})
    },
    value: {
      type: String,
      default: ''
    }
  },
  emits: ['update:visible'],
  data() {
    return {
      // The value was already fetched by the caller (before opening this dialog) - this
      // component never calls the reveal endpoint itself, it just displays what it was given.
      showDialog: this.visible
    }
  },
  methods: {
    close() {
      this.showDialog = false
      this.$emit('update:visible', false)
    }
  }
}
</script>
