<template>
  <div class="krry-main">
    <!-- Region -->
    <krry-container
      :box-operation="boxOperation"
      :box-title="boxTitle"
      :data-obj="dataObj"
      :filter-placeholder="filterPlaceholder"
      :filterable="filterable"
      :on-change-selected="emitChangeSelected"
      :selected-data="selectedData"
    />
  </div>
</template>

<script>
import krryContainer from './models/container'

export default {
  name: 'KrCascader',
  components: {
    krryContainer
  },
  props: {
    boxTitle: {
      type: Array,
      default: () => ['Province', 'City', 'District', 'Selected Region']
    },
    boxOperation: {
      type: Array,
      default: () => ['Add Province', 'Add City', 'Add District', 'Remove Region']
    },
    dataObj: {
      type: Object,
      default: () => {}
    },
    selectedData: {
      type: Array,
      default: () => []
    },
    filterable: {
      type: Boolean,
      default: () => false
    },
    filterPlaceholder: {
      type: String,
      default: () => 'Please enter search content'
    }
  },
  data() {
    return {
      hasSelectData: []
    }
  },
  watch: {},
  created() {},
  methods: {
    // Listener event for retrieving the selected data
    emitChangeSelected(val) {
      this.hasSelectData = val
      this.$emit('onChange', val)
    },
    // Hook providing access to the selected data
    getSelectedData() {
      return this.hasSelectData
    }
  }
}
</script>

<style lang="scss" scoped>
.krry-main {
  min-width: 906px;
}
</style>
