<template>
  <div class="el-transfer-panel district-panel">
    <div class="el-transfer-panel__header">
      <el-checkbox
        v-model="checkAll"
        :indeterminate="isIndeterminate"
        @change="handleCheckAllChange"
      >
        {{ title }}
      </el-checkbox>
      <span class="check-number"> {{ checkedData.length }}/{{ districtListMock.length }} </span>
    </div>
    <div class="el-transfer-panel__body">
      <div
        v-if="filterable"
        class="el-transfer-panel__filter el-input el-input--mini el-input--prefix"
      >
        <input
          v-model.trim="searchWord"
          :class="{ showClear: showClearBtn }"
          :placeholder="filterPlaceholder"
          autocomplete="off"
          class="paging-filter__input el-input__inner"
          type="text"
          @change="handleKeyword"
        />
        <span class="el-input__prefix">
          <el-icon class="el-input__icon"><Search /></el-icon>
        </span>
        <span v-if="searchWord && showClearBtn" class="clear-input">
          <el-icon @click="clearInp"><CircleClose /></el-icon>
        </span>
      </div>
      <el-checkbox-group
        v-if="districtListMock.length > 0"
        v-model="checkedData"
        :class="{ expand: !filterable }"
        @change="handleCheckedChange"
      >
        <el-checkbox
          v-for="(item, index) in districtListMock"
          :key="index"
          :disabled="item.disabled"
          :label="item"
          :title="item.label"
          class="el-transfer-panel__item"
        >
          <span v-sanitize="isHighlight ? filterHighlight(item.label) : item.label" />
        </el-checkbox>
      </el-checkbox-group>
      <p v-else class="no-data">{{ $t('NoData') }}</p>
    </div>
    <div class="vip-footer">
      <el-button :disabled="disabledPre" class="v-page" plain size="small" @click="prev">
        {{ pageTexts[0] || defaultPrev }}
      </el-button>
      <el-button :disabled="disabledNex" class="v-page" plain size="small" @click="next">
        {{ pageTexts[1] || defaultNext }}
      </el-button>
    </div>
  </div>
</template>

<script>
import i18n from '@/i18n/i18n'

export default {
  components: {},
  props: {
    title: {
      type: String,
      default: () => ''
    },
    operateId: {
      type: Number,
      default: () => 0
    },
    dataShowList: {
      type: Array,
      default: () => []
    },
    pageSize: {
      type: Number,
      default: () => 10
    },
    filterable: {
      type: Boolean
    },
    filterPlaceholder: {
      type: String,
      default: () => 'Search'
    },
    pageTexts: {
      type: Array,
      default: () => ['', '']
    },
    async: {
      type: Boolean,
      default: () => false // The selected region does not do async
    },
    isLastPage: {
      type: Boolean
    },
    isHighlight: {
      type: Boolean
    },
    highlightColor: {
      type: String,
      default: () => 'var(--color-primary)'
    },
    asyncSearchFlag: {
      // Whether an async search method has been configured
      type: Boolean
    },
    showClearBtn: {
      type: Boolean
    }
  },
  data() {
    return {
      districtListMock: [], // Displayed data (search and pagination automatically update this array)
      checkedData: [], // Already selected, data format: [id, id, id...]
      isIndeterminate: false,
      checkAll: false,
      searchWord: '',
      len: 0,
      total: 0,
      pageIndex: 0,
      disabledPre: true,
      disabledNex: false,
      asyncSearch: false, // Flag indicating an async search should be run
      asyncPageIndex: 1, // pageIndex for async pagination
      asyncSearchPageIndex: 1, // pageIndex for async search,
      defaultPrev: '< ' + (i18n?.global?.tc?.('PagePrev') || 'Prev'),
      defaultNext: (i18n?.global?.tc?.('PageNext') || 'Next') + ' >'
    }
  },
  watch: {
    // Watcher on the search box
    searchWord(newWord) {
      this.$emit('search-word', newWord, this.operateId)
    },
    // Watcher on districtListMock and checkAll
    districtListMock() {
      // The checkbox cannot be checked when there is no selected data in the box
      if (this.checkedData.length === 0) {
        this.checkAll = false
        this.isIndeterminate = false
      }
    },
    checkedData(newWord) {
      this.$emit('check-disable', newWord, this.operateId)
    },
    // The checkbox cannot be checked when the list has no data
    checkAll() {
      this.checkAll = this.districtListMock.length === 0 ? false : this.checkAll
    },
    dataShowList: {
      handler() {
        this.async ? this.asyncInitData() : this.initData()
      },
      deep: true
    }
  },
  created() {
    this.initData()
  },
  methods: {
    handleKeyword() {
      this.asyncSearchPageIndex = 1
      this.asyncSearchFlag &&
        this.$emit('get-data-by-keyword', this.searchWord, this.asyncSearchPageIndex)
    },
    // Paginated data
    initData() {
      this.len = this.dataShowList.length
      this.total = Math.ceil(this.len / this.pageSize)
      this.pageIndex = 0
      this.pageData()
    },
    pageData() {
      this.checkedData = []
      if (this.total > 1 && this.pageIndex < this.total - 1) {
        this.pageIndex === 0 ? (this.disabledPre = true) : (this.disabledPre = false)
        this.disabledNex = false
        this.districtListMock = this.dataShowList.slice(
          this.pageIndex * this.pageSize,
          this.pageIndex * this.pageSize + this.pageSize
        )
      } else {
        this.total > 1 ? (this.disabledPre = false) : (this.disabledPre = true)
        this.disabledNex = true
        this.districtListMock = this.dataShowList.slice(this.pageIndex * this.pageSize, this.len)
      }
    },
    // Data fetched asynchronously; check pagination button availability
    asyncInitData() {
      // Uncheck
      this.checkedData = []
      // Pagination button availability
      this.disabledNex = this.isLastPage
      this.disabledPre =
        this.asyncSearchFlag && this.asyncSearch
          ? this.asyncSearchPageIndex <= 1
          : this.asyncPageIndex <= 1
      // Assign
      this.districtListMock = this.dataShowList
    },
    // Previous page
    prev() {
      if (this.async) {
        // Fetch data asynchronously
        this.disabledPre = true
        this.asyncSearchFlag && this.asyncSearch
          ? this.$emit(
              'get-data-by-keyword',
              this.searchWord,
              this.asyncSearchPageIndex <= 1 ? 1 : --this.asyncSearchPageIndex
            )
          : this.$emit('get-data', this.asyncPageIndex <= 1 ? 1 : --this.asyncPageIndex)
      } else {
        this.pageIndex > 0 && --this.pageIndex
        this.pageData()
      }
    },
    // Next page
    next() {
      if (this.async) {
        // Fetch data asynchronously
        this.disabledNex = true
        this.asyncSearchFlag && this.asyncSearch
          ? this.$emit('get-data-by-keyword', this.searchWord, ++this.asyncSearchPageIndex)
          : this.$emit('get-data', ++this.asyncPageIndex)
      } else {
        this.pageIndex <= this.total - 1 && ++this.pageIndex
        this.pageData()
      }
    },
    // Single check
    handleCheckedChange(value) {
      const checkedCount = value.length
      this.checkAll = checkedCount === this.districtListMock.length
      this.isIndeterminate = checkedCount > 0 && checkedCount < this.districtListMock.length
      // Pass from child to parent
      this.$emit('check-district', value)
    },
    // Select all
    handleCheckAllChange(val) {
      this.checkedData = val
        ? this.districtListMock.filter((val) => !val.disabled).map((val) => val)
        : []
      this.isIndeterminate = false
      // Pass from child to parent
      this.$emit('check-district', this.checkedData)
    },
    clearInp() {
      this.$emit('clear-input')
    },
    filterHighlight(label) {
      const filterWord = this.searchWord.trim()
      label = label && label.trim()
      if (filterWord && label) {
        const reg = new RegExp(filterWord)
        return label.replace(
          reg,
          `<span style="color: ${this.highlightColor}">${filterWord}</span>`
        )
      } else {
        return label
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.district-panel {
  width: 298px;
  display: inline-block;
  box-sizing: border-box;
  vertical-align: middle;
  overflow: hidden;
  background: #fff;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 4px;

  .el-transfer-panel__header {
    position: relative;
    display: flex;
    align-items: center;
    height: 40px;
    margin: 0;
    padding: 0 15px;
    box-sizing: border-box;
    background: var(--el-fill-color-light, #f5f7fa);
    border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);

    .el-checkbox {
      display: inline-flex;
      align-items: center;
      height: auto;
      margin-right: 0;

      :deep(.el-checkbox__label) {
        font-size: 14px;
        line-height: 1;
      }
    }
  }

  .el-transfer-panel__body {
    height: 335px;

    .el-transfer-panel__filter {
      // This div also carries Element Plus's .el-input class (inline-flex + width:100%),
      // which would treat the input and icon as flex items sitting side by side out of
      // place, and width:100% combined with left/right margin would overflow the panel.
      // Force block + width:auto: block-level fills the available width (minus margin),
      // the input takes the full row, and the icon is absolutely positioned over the left.
      display: block;
      width: auto;
      // This div also carries Element Plus's .el-input class, which gives it a fixed
      // height:var(--el-input-height,32px); reset it back to auto here so the container's
      // height is driven by the inner 30px input, avoiding a 32/30 mismatch
      height: auto;
      box-sizing: border-box;
      position: relative;
      // margin: 10px 15px;
      line-height: normal;

      .paging-filter__input {
        display: block;
        width: 100%;
        height: 30px;
        line-height: 30px;
        box-sizing: border-box;
        padding-left: 25px;
        border: 1px solid var(--el-border-color, #dcdfe6);
        border-radius: 4px;
        font-size: 13px;

        &:focus {
          outline: none;
          border-color: var(--el-color-primary);
        }
      }

      .el-input__prefix {
        position: absolute;
        height: 30px;
        left: 15px;
        top: 15px;
        width: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--el-text-color-placeholder, #a8abb2);
        pointer-events: none;

        .el-input__icon {
          height: 30px;
          font-size: 14px;
          margin: 0;
        }
      }

      .paging-filter__input.showClear {
        padding-right: 30px;
      }

      .clear-input {
        position: absolute;
        height: 100%;
        right: 10px;
        top: 0;
        text-align: center;
        color: #c0c4cc;
        transition: all 0.3s;
        line-height: 33px;
        visibility: hidden;
        opacity: 0;

        &:hover {
          color: #909399;
        }
      }

      &:hover {
        .clear-input {
          opacity: 1;
          visibility: visible;
        }
      }
    }
  }

  .el-checkbox-group {
    height: 295px;
    overflow: auto;

    &.expand {
      height: 290px;
    }

    .el-transfer-panel__item {
      display: block;
      line-height: 28px;
      height: 28px;

      :deep(.el-checkbox__label) {
        font-weight: 400;
        line-height: 28px;
      }

      :deep(.el-checkbox__input) {
        top: 7px;
      }
    }
  }

  .check-number {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
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
    display: flex;
    position: relative;
    width: 100%;
    box-sizing: border-box;
    margin: 0;
    text-align: center;
    border-top: 1px solid #ebeef5;

    .v-page {
      width: 50%;
      height: 30px;
      padding: 0;
      border: none;
      margin: 0;
      border-radius: 0;
      font-size: 13px;
      line-height: 1;

      &:first-child {
        border-right: 1px solid #ebeef5;
      }
    }
  }
}
</style>
