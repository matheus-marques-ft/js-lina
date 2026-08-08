<template>
  <BaseList
    :extra-actions="extraActions"
    :url="url"
    :columns-meta="columnsMeta"
    :columns-exclude="columnsExclude"
  />
</template>

<script>
import BaseList from './BaseList'
import { addBasePath, download } from '@/utils/common/index'

export default {
  name: 'OfflineList',
  components: {
    BaseList
  },
  props: {
    url: {
      type: String,
      default: () => '/api/v1/terminal/sessions/?is_finished=1'
    }
  },
  data() {
    const vm = this
    return {
      extraActions: [
        {
          name: 'replay',
          title: this.$t('Replay'),
          icon: 'fa-play',
          type: 'warning',
          // TODO The current version of the magnus proxy does not support replay for mongodb protocol sessions
          can: ({ row }) =>
            vm.hasPerms(row, 'view') &&
            !(row.protocol === 'mongodb' && row.terminal.type === 'magnus'),
          callback: function ({ row, tableData }) {
            // Navigate to the luna page
            const replayUrl = '/luna/replay/' + row.id
            window.open(addBasePath(replayUrl))
          }
        },
        {
          name: 'download',
          title: this.$t('Download'),
          type: 'primary',
          can: ({ row }) =>
            vm.hasPerms(row, 'download') &&
            !(row.protocol === 'mongodb' && row.terminal.type === 'magnus'),
          callback: function ({ row, tableData }) {
            // Navigate to the download page
            download(`/api/v1/terminal/sessions/${row.id}/replay/download/`)
          }
        }
      ],
      columnsExclude: ['has_command'],
      columnsMeta: {
        command_amount: {
          label: this.$t('CommandsTotal')
        }
      }
    }
  },
  methods: {
    hasPerms(row, type) {
      return row['can_replay'] && this.$hasPerm(`terminal.${type}_sessionreplay`)
    }
  }
}
</script>
