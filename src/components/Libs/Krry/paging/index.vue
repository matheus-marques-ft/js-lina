<template>
  <div class="krry-main">
    <el-row :gutter="10">
      <el-col :md="11" :sm="24">
        <krry-box
          ref="noSelect"
          :async="async"
          :async-search-flag="asyncSearchFlag"
          :data-show-list="notSelectDataList"
          :filter-placeholder="filterPlaceholder[0] || $tc('Search')"
          :filterable="filterable"
          :highlight-color="highlightColor"
          :is-highlight="isHighlight"
          :is-last-page="isLastPage"
          :operate-id="0"
          :page-size="pageSize"
          :page-texts="pageTexts"
          :show-clear-btn="showClearBtn"
          :title="boxTitle[0] || $tc('Selection')"
          @check-district="noCheckSelect"
          @search-word="searchWord"
          @check-disable="checkDisable"
          @get-data="getData"
          @get-data-by-keyword="getDataByKeyword"
          @clear-input="clearQueryInp('left')"
        />
      </el-col>
      <el-col :md="2" :sm="24" class="buttons">
        <div class="opera">
          <svg-icon v-if="transferOnCheck" class="arrow" icon-class="arrow" />
          <template v-else>
            <el-button
              :disabled="disablePre"
              class="el-transfer__button"
              icon="ArrowLeft"
              size="small"
              @click="deleteData"
            />
            <el-button
              :disabled="disableNex"
              class="el-transfer__button"
              icon="ArrowRight"
              size="small"
              type="primary"
              @click="addData"
            />
          </template>
        </div>
      </el-col>
      <el-col :md="11" :sm="24">
        <krry-box
          ref="hasSelect"
          :data-show-list="checkedData"
          :filter-placeholder="filterPlaceholder[1] || $tc('Search')"
          :filterable="filterable"
          :highlight-color="highlightColor"
          :is-highlight="isHighlight"
          :operate-id="1"
          :page-size="pageSize"
          :page-texts="pageTexts"
          :show-clear-btn="showClearBtn"
          :title="boxTitle[1] || $tc('Selected')"
          @check-district="hasCheckSelect"
          @search-word="searchWord"
          @check-disable="checkDisable"
          @clear-input="clearQueryInp('right')"
        />
      </el-col>
    </el-row>
  </div>
</template>

<script>
import krryBox from './models/box'

export default {
  name: 'KrryPaging',
  components: {
    krryBox
  },
  props: {
    boxTitle: {
      type: Array,
      default: () => ['', '']
    },
    pageSize: {
      type: Number,
      default: 160
    },
    dataList: {
      type: Array,
      default: () => []
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
      type: Array,
      default: () => ['', '']
    },
    pageTexts: {
      type: Array,
      default: () => ['', '']
    },
    sort: {
      type: Boolean,
      default: () => false
    },
    async: {
      type: Boolean,
      default: () => false
    },
    getPageData: {
      type: Function,
      default: () => []
    },
    getSearchData: {
      type: Function,
      default: () => []
    },
    isHighlight: {
      type: Boolean,
      default: () => false
    },
    highlightColor: {
      type: String,
      default: () => '#ff2b2b'
    },
    showClearBtn: {
      type: Boolean,
      default: () => false
    },
    transferOnCheck: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      notSelectDataList: [], // Unselected data (already filtered out of the selection)
      checkedData: [], // Selected data

      dataListNoCheck: [], // Data before search filtering
      selectListCheck: [], // Data before search filtering

      noCheckData: [], // Checked data from the unselected region (pending addition to the selection)
      hasCheckData: [], // Checked data from the selected region (pending removal from the unselected region)

      noSelectKeyword: '',
      haSelectKeyword: '',

      disablePre: true,
      disableNex: true,

      manualEmpty: false, // Whether the selected region's data was manually cleared

      asyncDataList: [], // Data source from the async request
      isLastPage: false // Whether the async request reached the last page
    }
  },
  computed: {
    // Data passed to the backend for saving (array of ids of the selected data)
    selectIdList() {
      return this.selectListCheck.map((item) => item.id)
    },
    originList() {
      return this.async ? this.asyncDataList : this.dataList
    },
    asyncSearchFlag() {
      // Whether an async search method has been configured
      return this.async && this.getSearchData !== undefined
    }
  },
  watch: {
    selectIdList(newVal) {
      // Listener event for retrieving the selected data
      const moveKeys = [
        ...this.noCheckData.map((item) => item.id),
        ...this.hasCheckData.map((item) => item.id)
      ]
      this.hasCheckData = []
      this.noCheckData = []
      this.$emit('onChange', newVal, moveKeys)
    },
    dataList: {
      handler() {
        !this.async && this.initData()
      },
      deep: true
    },
    selectedData: {
      handler() {
        this.initData(true)
      },
      deep: true
    }
  },
  created() {
    this.async ? this.getData(1, true) : this.initData(true)
  },
  methods: {
    // Paginated data, initialize the data, filter the selected data
    initData(selectedChange) {
      // If this.checkedData is empty and the selected region was never manually cleared, get it from selectedData
      if ((!this.checkedData.length && !this.manualEmpty) || selectedChange) {
        this.checkedData = JSON.parse(JSON.stringify(this.selectedData))
        const keywords = this.$refs.hasSelect ? this.$refs.hasSelect.searchWord : ''
        keywords && this.searchWord(keywords, 1)
      }
      if (!this.async) {
        this.selectListCheck = JSON.parse(JSON.stringify(this.checkedData))
        const checkDataId = this.selectListCheck.map((ele) => ele.id)
        this.notSelectDataList = this.originList.filter((ele) => !checkDataId.includes(ele.id))
        this.dataListNoCheck = JSON.parse(JSON.stringify(this.notSelectDataList))
      } else {
        if (selectedChange) {
          this.selectListCheck = JSON.parse(JSON.stringify(this.checkedData))
        }
        const checkDataId = this.selectListCheck.map((ele) => ele.id)
        this.notSelectDataList = this.originList.filter(
          (ele) =>
            !checkDataId.includes(ele.id) &&
            (ele.label.includes(this.noSelectKeyword) || this.asyncSearchFlag)
        )
        this.dataListNoCheck = this.originList.filter((ele) => !checkDataId.includes(ele.id))
      }
    },
    searchWord(keyword, titleId) {
      // Filter out the data, keeping only what matches the search
      // If async search is configured, no need to filter by keyword (this.asyncSearchFlag is true)
      if (titleId === 0) {
        this.noSelectKeyword = keyword
        if (!this.asyncSearchFlag) {
          this.notSelectDataList = this.dataListNoCheck.filter((val) => val.label.includes(keyword))
        }
      } else {
        this.haSelectKeyword = keyword
        this.checkedData = this.selectListCheck.filter((val) => val.label.includes(keyword))
      }
      const refsName = titleId === 0 ? 'noSelect' : 'hasSelect'
      // Execute with a delay
      setTimeout(() => {
        !this.async && this.$refs[refsName].initData()
      }, 0)
    },
    // Check the availability of the left/right buttons
    checkDisable(data, operateId) {
      if (operateId === 0) {
        this.disableNex = !(data.length > 0)
      } else {
        this.disablePre = !(data.length > 0)
      }
    },
    // Selection in the unselected region
    noCheckSelect(val) {
      this.noCheckData = val
      if (this.transferOnCheck) {
        setTimeout(() => this.addData(), 300)
      }
    },
    // Selection in the selected region
    hasCheckSelect(val) {
      this.hasCheckData = val
      setTimeout(() => this.deleteData(), 300)
    },
    // Key point: treat the unselected data as the filter array for the selected side, and the
    // selected data as the filter array for the unselected side, filter across the global data,
    // then run a search once at the end
    // Add to the selection
    addData() {
      const noCheckDataId = this.noCheckData.map((ele) => ele.id)
      // Filter the pending-selection region's data
      // If async search is configured, no need to filter by keyword (this.asyncSearchFlag is true)
      this.notSelectDataList = this.notSelectDataList.filter(
        (ele) =>
          !noCheckDataId.includes(ele.id) &&
          (ele.label.includes(this.noSelectKeyword) || this.asyncSearchFlag)
      )
      this.dataListNoCheck = this.dataListNoCheck.filter((ele) => !noCheckDataId.includes(ele.id))
      // Add to the selected region's data
      if (!this.async && this.sort) {
        // Sort by filtering from the fixed, unchanging full dataset so the order stays
        // consistent, but this can be sluggish with large amounts of data
        // Async pagination does not support sorting
        const dataListNoCheckId = this.dataListNoCheck.map((ele) => ele.id)
        this.checkedData = this.originList.filter(
          (ele) => !dataListNoCheckId.includes(ele.id) && ele.label.includes(this.haSelectKeyword)
        )
        this.selectListCheck = this.originList.filter((ele) => !dataListNoCheckId.includes(ele.id))
      } else {
        // This approach is more efficient, but cannot be sorted
        this.checkedData.push(...this.noCheckData)
        this.selectListCheck.push(...this.noCheckData)
        this.checkedData = this.checkedData.filter((ele) =>
          ele.label.includes(this.haSelectKeyword)
        )
      }
    },
    // Remove from the selection
    deleteData() {
      // Filter the selected region's data
      const hasCheckDataId = this.hasCheckData.map((ele) => ele.id)
      this.checkedData = this.checkedData.filter(
        (ele) => !hasCheckDataId.includes(ele.id) && ele.label.includes(this.haSelectKeyword)
      )
      this.selectListCheck = this.selectListCheck.filter((ele) => !hasCheckDataId.includes(ele.id))

      this.manualEmpty = !this.checkedData.length

      // Add back to the pending-selection region's data
      const selectListCheckId = this.selectListCheck.map((ele) => ele.id)
      // const checkedDataId = this.checkedData.map(ele => ele.id)
      // If async search is configured, no need to filter by keyword (this.asyncSearchFlag is true)
      this.notSelectDataList = this.originList.filter(
        (ele) =>
          !selectListCheckId.includes(ele.id) &&
          (ele.label.includes(this.noSelectKeyword) || this.asyncSearchFlag)
      )
      this.dataListNoCheck = this.originList.filter((ele) => !selectListCheckId.includes(ele.id))
    },
    // Hook providing access to the selected data
    getSelectedData() {
      return this.selectIdList
    },
    clearQueryInp(position) {
      switch (position) {
        case 'left':
          this.$refs.noSelect.searchWord = ''
          this.asyncSearchFlag && this.getDataByKeyword('')
          break
        case 'right':
          this.$refs.hasSelect.searchWord = ''
          break
        default:
          break
      }
    },
    async getDataByKeyword(keyword, pageIndex) {
      keyword = keyword.trim()
      if (keyword) {
        this.$nextTick(() => {
          this.$refs.noSelect.asyncSearch = true
        })
        const resData = await this.getSearchData(keyword, pageIndex, this.pageSize)
        if (Array.isArray(resData) && resData.length) {
          this.asyncDataList = resData
          this.notSelectDataList = resData
          this.initData()
          this.isLastPage = resData.length < this.pageSize
        } else {
          this.notSelectDataList = []
          this.isLastPage = true
        }
      } else {
        this.$refs.noSelect.asyncSearch = false
        await this.getData(1)
      }
    },
    async getData(pageIndex, changed = false) {
      this.$nextTick(() => {
        // Set the async pagination's pageIndex
        this.$refs.noSelect.asyncPageIndex = pageIndex
        // Clear the left-hand input box
        this.$refs.noSelect.searchWord = ''
        // Set asyncSearch to true
        this.$refs.noSelect.asyncSearch = false
      })
      const resData = await this.getPageData(pageIndex, this.pageSize)
      if (Array.isArray(resData) && resData.length) {
        this.asyncDataList = resData
        this.notSelectDataList = resData
        // This must be true here, otherwise the right side can't be searched -
        // once you search and confirm, it breaks
        this.initData(changed)
        this.isLastPage = resData.length < this.pageSize
      } else {
        this.notSelectDataList = []
        this.isLastPage = true
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.krry-main {
  min-width: 600px;
}

.inner-center {
  margin: 0 5px;
}

.buttons {
  vertical-align: middle;
}

.opera {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 415px;

  .arrow {
    width: 1.25em;
    height: 1.25em;
    color: #888888;
  }

  @media screen and (max-width: 992px) {
    margin: 8px 8px;
    text-align: start;
  }

  .el-button.is-circle {
    border-radius: 50%;
    padding: 12px;
    display: block;
    margin: 25px auto;
  }

  .el-transfer__button {
    padding: 5px;
  }
}
</style>
