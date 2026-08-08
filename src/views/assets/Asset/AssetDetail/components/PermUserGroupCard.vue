<template>
  <div>
    <IBox v-bind="$attrs" :fa="icon" :title="title" :type="type">
      <table class="card-table">
        <div v-cloak v-if="iObjects.length > 0">
          <tr v-for="obj of iObjects" :key="obj.value" class="item">
            <td class="name-cell">
              <el-tooltip
                :content="obj.label"
                :show-after="500"
                effect="dark"
                placement="left"
                style="margin: 4px"
              >
                <el-link class="detail" @click="goDetail(obj)">
                  {{ obj.label }}
                </el-link>
              </el-tooltip>
            </td>
            <td class="action-cell">
              <el-button size="small" type="primary" @click="buttonClickCallback(obj)">
                {{ buttonTitle }}
              </el-button>
            </td>
          </tr>
        </div>
        <div v-cloak v-else style="text-align: center">
          {{ $t('NoData') }}
        </div>
      </table>
    </IBox>
    <Drawer
      v-model:visible="drawerVisible"
      :component="detailDrawer"
      :component-props="detailDrawerProps"
      :has-footer="false"
      :title="title"
    />
  </div>
</template>

<script>
import IBox from '@/components/Common/IBox'
import Drawer from '@/components/Drawer/index.vue'

export default {
  name: 'PermUserGroupCard',
  components: {
    IBox,
    Drawer
  },
  props: {
    icon: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: 'primary'
    },
    url: {
      type: String,
      required: true
    },
    detailRoute: {
      type: [String, Function],
      default: ''
    },
    buttonTitle: {
      type: String,
      required: true
    },
    buttonClickCallback: {
      type: Function,
      default: (obj) => {}
    }
  },
  data() {
    return {
      detailDrawer: '',
      detailDrawerProps: {},
      drawerVisible: false,
      objects: []
    }
  },
  computed: {
    iObjects() {
      return this.objects
    }
  },
  mounted() {
    this.loadObjects()
  },
  methods: {
    async loadObjects() {
      const data = await this.$axios.get(this.url)
      for (const v of data) {
        v['label'] = v['name']
      }
      this.objects = data
    },
    goDetail(obj) {
      this.detailDrawer = this.detailRoute
      this.detailDrawerProps = {
        drawerContext: {
          isDrawer: true,
          action: 'detail',
          row: {},
          col: {},
          id: obj.id,
          params: { id: obj.id },
          query: {},
          routeName: this.$route.name || ''
        }
      }
      this.drawerVisible = true
    }
  }
}
</script>

<style lang="scss" scoped>
.card-table {
  width: 100%;
  table-layout: fixed;
}

[v-cloak] {
  display: none !important;
}

b,
strong {
  font-size: 13px;
}

tr.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  // Use flex to center the row: the (small) button is taller than the text, and the
  // previous float + inline cell couldn't include the button in the line-height
  // calculation, causing the button to overflow onto the border-bottom. Centering
  // with flex vertically centers the button, with padding leaving spacing from the
  // border above and below.
  padding: 6px 8px;
  border-bottom: 1px solid #e7eaec;

  &:last-child {
    border-bottom: 0;
  }

  .name-cell {
    flex: 1 1 auto;
    min-width: 0;
    line-height: 1.2;
    padding: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .action-cell {
    flex: 0 0 auto;
    padding: 0;
  }
}

.box-margin {
  margin-bottom: 20px;
}
</style>
