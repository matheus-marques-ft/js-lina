<template>
  <Dialog
    v-bind="$attrs"
    :show-cancel="false"
    :title="title"
    class="bulk-create-result-dialog"
    width="960px"
    @confirm="closeDialog"
  >
    <el-alert style="margin-bottom: 10px" type="info">
      <span v-for="item of summary" :key="item.key"
        ><b>{{ item.label }}</b
        >: {{ item.value }}
      </span>
    </el-alert>
    <DataTable :config="config" />
  </Dialog>
</template>

<script>
import Dialog from '@/components/Dialog/index.vue'
import DataTable from '@/components/Table/DataTable/index.vue'
import { h } from 'vue'

const StateFormatter = {
  name: 'BulkCreateResultStateFormatter',
  props: {
    row: {
      type: Object,
      default: () => ({})
    }
  },
  render() {
    if (this.row.error) {
      return h('span', { class: 'color-error' }, [this.$t('Error'), ': ', this.row.error])
    }

    if (this.row.state) {
      const stateMap = {
        created: this.$tc('Created'),
        updated: this.$tc('Updated'),
        skipped: this.$tc('Skipped')
      }
      const stateClsMap = {
        created: 'color-primary',
        updated: 'color-success',
        skipped: 'color-default'
      }
      return h(
        'span',
        { class: stateClsMap[this.row.state] },
        stateMap[this.row.state] || this.row.state
      )
    }

    return h('span', '-')
  }
}

export default {
  name: 'ResultDialog',
  components: {
    StateFormatter,
    DataTable,
    Dialog
  },
  props: {
    result: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      title: this.$t('AddAccountResult'),
      config: {
        columns: [
          {
            prop: 'asset',
            label: this.$t('Asset')
          },
          {
            prop: 'account',
            label: this.$t('Account')
          },
          {
            prop: 'state',
            label: this.$t('Status'),
            width: '200px',
            showOverflowTooltip: true,
            formatter: StateFormatter
          }
        ],
        totalData: this.result
      }
    }
  },
  computed: {
    summary() {
      const labels = {
        total: this.$tc('Total'),
        created: this.$tc('Created'),
        updated: this.$tc('Updated'),
        skipped: this.$tc('Skipped'),
        error: this.$tc('Error')
      }
      // Consistent with StateFormatter: classify by error first, then by state.
      // The old implementation used _.groupBy(result, 'state'); error rows without
      // a state would be grouped into an 'undefined' group, producing an unlabeled
      // summary item while never counting errors, resulting in incorrect counts.
      const counts = { total: this.result.length, created: 0, updated: 0, skipped: 0, error: 0 }
      for (const row of this.result) {
        if (row.error) {
          counts.error += 1
        } else if (counts[row.state] !== undefined) {
          counts[row.state] += 1
        }
      }
      const order = ['total', 'created', 'updated', 'skipped', 'error']
      return order
        .filter((key) => key === 'total' || counts[key] > 0)
        .map((key) => ({ label: labels[key], value: counts[key], key }))
    }
  },
  methods: {
    closeDialog() {
      this.$emit('close-all')
    }
  }
}
</script>

<style scoped>
.color-error {
  color: var(--color-danger);
}

.color-primary {
  color: var(--color-primary);
}

.color-success {
  color: var(--color-success);
}

:deep(.el-data-table .el-table .el-table__row > td > div > span) {
  white-space: inherit;
}
</style>

<!-- el-dialog teleports to body, so internal styles must use a non-scoped block; selector
     specificity (0,4,0) is higher than el-data-table's .el-data-table[data-v] .el-pagination
     (0,3,0), so !important is not needed -->
<style lang="scss">
.el-dialog.dialog.bulk-create-result-dialog .el-pagination {
  padding: 1px 0;
}
</style>
