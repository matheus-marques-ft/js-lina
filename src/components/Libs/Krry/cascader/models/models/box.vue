<template>
  <div class="el-transfer-panel district-panel">
    <div class="el-transfer-panel__header">
      <el-checkbox
        v-model="checkAll"
        :indeterminate="isIndeterminate"
        @change="handleCheckAllChange"
        >{{ title }}</el-checkbox
      >
      <span class="check-number">{{ selectedDistrict.length }}/{{ districtListMock.length }}</span>
    </div>
    <div class="el-transfer-panel__body">
      <div
        v-if="filterable"
        class="el-transfer-panel__filter el-input el-input--small el-input--prefix"
      >
        <input
          v-model="searchWord"
          type="text"
          autocomplete="off"
          :placeholder="filterPlaceholder"
          class="el-input__inner"
        />
        <span class="el-input__prefix" style="left: 0px">
          <el-icon class="el-input__icon"><Search /></el-icon>
        </span>
      </div>
      <el-checkbox-group
        v-if="districtListMock.length > 0"
        v-model="selectedDistrict"
        :class="{ expand: !filterable }"
        @change="handleCheckedChange"
      >
        <el-checkbox
          v-for="(city, index) in districtListMock"
          :key="index"
          class="el-transfer-panel__item"
          :disabled="city.disabled"
          :title="city.label"
          :label="city"
          >{{ city.label }}</el-checkbox
        >
      </el-checkbox-group>
      <p v-else class="no-data">No Data</p>
    </div>
    <div class="vip-footer">
      <el-button
        link
        :disabled="selectedDistrict.length <= 0"
        size="small"
        round
        @click="checkedSelected"
      >
        <span>{{ operation }}</span>
      </el-button>
    </div>
  </div>
</template>

<script>
export default {
  components: {},
  props: {
    title: {
      type: String,
      default: () => ''
    },
    operation: {
      type: String,
      default: () => ''
    },
    operateId: {
      type: Number,
      default: () => 0
    },
    // Region data
    districtList: {
      type: Array,
      default: () => []
    },
    filterable: {
      type: Boolean,
      default: () => false
    },
    filterPlaceholder: {
      type: String,
      default: () => ''
    }
  },
  data() {
    return {
      districtListMock: [], // Displayed data (search automatically updates this array)
      selectedDistrict: [], // Already selected, data format: [regionId, id, id...]
      father: {}, // Parent data
      isIndeterminate: false,
      checkAll: false,
      searchWord: '',
      buttonAble: true
    }
  },
  watch: {
    // Watcher on the search box
    searchWord(newWord, oldWord) {
      // Re-fetch the data
      this.districtListMock = this.districtList
      // Filter out the data, keeping only what matches the search
      this.districtListMock = this.districtListMock.filter((val) => val.label.includes(newWord))
    },
    // Watches the province or city selection and automatically updates the city or county list
    districtList() {
      this.getDistrict()
      // If the region data is empty, the selected data must also be cleared
      if (this.districtList.length === 0) {
        this.selectedDistrict = []
      }
    },
    // Watcher on districtListMock and checkAll
    districtListMock() {
      // The checkbox cannot be checked when there is no selected data in the box
      if (this.selectedDistrict.length === 0) {
        this.checkAll = false
        this.isIndeterminate = false
      }
    },
    // The checkbox cannot be checked when the list has no data
    checkAll() {
      this.checkAll = this.districtListMock.length === 0 ? false : this.checkAll
    }
  },
  created() {
    this.getDistrict()
  },
  methods: {
    // Get region data
    getDistrict() {
      this.districtListMock = this.districtList
      // Clear the selection
      this.selectedDistrict = []
    },
    // Single check
    handleCheckedChange(value) {
      const checkedCount = value.length
      this.checkAll = checkedCount === this.districtListMock.length
      this.isIndeterminate = checkedCount > 0 && checkedCount < this.districtListMock.length
      this.$emit('check-district', value)
    },
    // Select all
    handleCheckAllChange(val) {
      this.selectedDistrict = val
        ? this.districtListMock.filter((val) => !val.disabled).map((val) => val)
        : []
      this.isIndeterminate = false
    },
    // Add to the selection or remove a selected region
    checkedSelected() {
      const selectedList = []
      const filterId = []
      if (this.operateId === 0) {
        // Add at province level
        for (const val of this.selectedDistrict) {
          selectedList.push({
            id: val.id,
            label: val.label
          })
          filterId.push(val.id)
        }
        this.$emit('selected-checked', selectedList, filterId)
      } else if (this.operateId === 1 || this.operateId === 2) {
        // Add at city or county level
        for (const val of this.selectedDistrict) {
          selectedList.push({
            id: this.father.id + '-' + val.id,
            label: this.father.label + '-' + val.label
          })
          filterId.push(val.id)
        }
        this.$emit('selected-checked', selectedList, filterId)
      } else {
        // Remove a selected region
        for (const val of this.selectedDistrict) {
          selectedList.push({
            id: val.id,
            label: val.label
          })
        }
        this.$emit('delete-checked', selectedList)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.district-panel {
  width: 200px;

  .el-transfer-panel__header {
    .el-checkbox {
      display: inline-block;
    }
  }
  .el-transfer-panel__body {
    height: 292px;
    padding: 6px 0;

    .el-transfer-panel__filter {
      line-height: 0;
      margin: 6px 14px 12px;
    }
  }
  .el-checkbox-group {
    height: 240px;
    overflow: auto;
    &.expand {
      height: 290px;
    }

    .el-transfer-panel__item {
      display: block;
    }
  }
  .check-number {
    position: absolute;
    right: 15px;
    top: 0;
    color: #909399;
    font-size: 12px;
    font-weight: 400;
  }
  .no-data {
    font-size: 14px;
    margin: 0;
    height: 30px;
    line-height: 30px;
    padding: 6px 15px 0;
    color: #909399;
    text-align: center;
  }
  .vip-footer {
    position: relative;
    margin: 0;
    padding: 5px 0;
    text-align: center;
    border-top: 1px solid #ebeef5;
  }
}
</style>
