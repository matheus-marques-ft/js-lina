<template>
  <div>
    <krry-box
      ref="prov"
      :operation="boxOperation[0]"
      :title="boxTitle[0]"
      :operate-id="0"
      :district-list="provinceList"
      :filterable="filterable"
      :filter-placeholder="filterPlaceholder"
      @check-district="checkProvince"
      @selected-checked="selectedProvince"
    />
    <krry-box
      ref="city"
      :operation="boxOperation[1]"
      :title="boxTitle[1]"
      :operate-id="1"
      :district-list="cityList"
      :filterable="filterable"
      :filter-placeholder="filterPlaceholder"
      @check-district="checkCity"
      @selected-checked="selectedCity"
    />
    <krry-box
      ref="county"
      :operation="boxOperation[2]"
      :title="boxTitle[2]"
      :operate-id="2"
      :district-list="countyList"
      :filterable="filterable"
      :filter-placeholder="filterPlaceholder"
      @selected-checked="selectedCountry"
    />
    <el-icon class="inner-center"><DArrowRight /></el-icon>
    <krry-box
      style="width: 260px"
      :operation="boxOperation[3]"
      :title="boxTitle[3]"
      :district-list="checkedDistrict"
      :filterable="filterable"
      :filter-placeholder="filterPlaceholder"
      @delete-checked="deleteCheck"
    />
  </div>
</template>

<script>
import krryBox from './models/box'
export default {
  components: {
    krryBox
  },
  props: {
    boxTitle: {
      type: Array,
      default: () => []
    },
    boxOperation: {
      type: Array,
      default: () => []
    },
    // Region data
    dataObj: {
      type: Object,
      default: () => {}
    },
    // Already-selected data
    selectedData: {
      type: Array,
      default: () => []
    },
    onChangeSelected: {
      type: Function,
      default: () => () => {}
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
      flag: false, // Lock for the watcher on the province-id variable used for the split warehouse; not executed on the first trigger since data isn't initialized yet
      provinceList: [], // Province-level data
      cityList: [], // City-level data
      countyList: [], // County/district-level data
      checkedDistrict: [], // Already-selected data
      filterProvince: [], // Province-level filter ids
      filterCity: [], // City-level filter ids
      filterCounty: [] // County/district-level filter ids
    }
  },
  computed: {
    // Maps the data ids of the selected regions
    selectDistrictId() {
      return this.checkedDistrict.map((val) => val.id)
    }
  },
  watch: {
    dataObj: {
      handler() {
        this.getDistrict()
      },
      deep: true
    },
    selectedData: {
      handler() {
        this.getDistrict()
      },
      deep: true
    },
    checkedDistrict(newVal) {
      this.onChangeSelected(newVal)
    }
  },
  created() {
    this.getDistrict()
  },
  methods: {
    // Get region data
    async getDistrict() {
      // Data returned from the backend after processing
      this.flag = true // Data finished loading, unlock
      // Filter the already-selected data
      this.checkedDistrict = JSON.parse(JSON.stringify(this.selectedData))
      this.initFilter(this.checkedDistrict)
      // Get province-level data
      this.getProvince()
    },
    // Get province-level data
    getProvince() {
      this.provinceList = [] // Clear first
      for (const key in this.dataObj.province) {
        this.provinceList.push({
          id: key,
          label: this.dataObj.province[key]
        })
        // Province-level filtering
        this.handleFilterProvince()
      }
    },
    // Get city-level data; val comes back from the child component's custom
    // transfer box: [regionObj, regionObj, ...]
    checkProvince(val) {
      const obj = val[val.length - 1]
      let flag = true
      if (obj !== undefined) {
        const id = obj.id
        for (const key in this.dataObj.city) {
          if (id === key) {
            // Matched id, pass the corresponding city-level data to the child component
            this.cityList = this.dataObj.city[key]
            // Filtering
            this.handleFilterCity()
            // Filtering
            // Then clear the previous county-level data
            this.countyList = []
            // Put the parent object into the city-level component
            this.$refs.city.father = {
              id: id,
              label: obj.label
            }
            flag = false
            break
          }
        }
      }
      // If no city-level match, clear both city and county levels
      if (flag) {
        this.cityList = []
        this.countyList = []
      }
    },
    // Get county-level data; val comes back from the child component's custom
    // transfer box: [regionObj, regionObj, ...]
    checkCity(val) {
      const obj = val[val.length - 1]
      let flag = true
      if (obj !== undefined) {
        const id = obj.id
        for (const key in this.dataObj.county) {
          if (id.toString() === key) {
            // Matched id, pass the corresponding county-level data to the child component
            this.countyList = this.dataObj.county[key]
            // Filtering
            this.handleFilterCounty()
            // Get province-level data
            const fatherId = this.$refs.city.father.id
            const fatherText = this.$refs.city.father.label
            // Concatenate the city-level data into the county-level component
            this.$refs.county.father = {
              id: fatherId + '-' + id,
              label: fatherText + '-' + obj.label
            }
            flag = false
            break
          }
        }
      }
      // No county-level match, show empty
      if (flag) {
        this.countyList = []
      }
    },
    // Add from province level to the selected region; params: val: array of province
    // objects, filterId: array of the selected province ids
    selectedProvince(val, filterId) {
      this.checkedDistrict = this.checkedDistrict.concat(val)
      this.filterProvince = this.filterProvince.concat(filterId)
      // If a filtered city-level region still has county-level regions, merge into one city
      for (const val of filterId) {
        for (const vq of this.checkedDistrict) {
          const selectId = vq.id.split('-')
          // If the split array length is greater than 1, there is a region below city
          // level, so merge it into one province-level region
          if (selectId.length > 1 && selectId[0] === val) {
            // Remove the city-level data from the selected regions, merging into one province
            this.checkedDistrict = this.checkedDistrict.filter((vl) => vl !== vq)
            // The current province has been merged, remove that city and county data from the filter arrays
            this.filterCity = this.filterCity.filter((vf) => vf.toString() !== selectId[1])
            this.filterCounty = this.filterCounty.filter((vs) => vs.toString() !== selectId[2])
          }
        }
      }
      // Clear the city and county regions below
      this.cityList = []
      this.countyList = []
      // Filtering
      this.handleFilterProvince()
    },
    // Add from city level to the selected region
    selectedCity(val, filterId) {
      this.checkedDistrict = this.checkedDistrict.concat(val)
      this.filterCity = this.filterCity.concat(filterId)
      // If a filtered city-level region still has county-level regions, merge into one city
      for (const val of filterId) {
        for (const vq of this.checkedDistrict) {
          const selectId = vq.id.split('-')
          // If the split array length is 3, there is a county-level region, and that
          // city-level region's id matches the one currently being added, merge into one city-level region
          if (selectId.length === 3 && selectId[1] === val.toString()) {
            // Remove the county-level data from the selected regions, merging into one city
            this.checkedDistrict = this.checkedDistrict.filter((vl) => vl !== vq)
            // The current city has been merged, remove that county data from the filter array
            this.filterCounty = this.filterCounty.filter((vs) => vs.toString() !== selectId[2])
          }
        }
      }
      // Clear the county region below
      this.countyList = []
      // Filtering
      this.handleFilterCity()
    },
    // Add from county level to the selected region
    selectedCountry(val, filterId) {
      this.checkedDistrict = this.checkedDistrict.concat(val)
      this.filterCounty = this.filterCounty.concat(filterId)
      // Filtering
      this.handleFilterCounty()
    },
    // Province-level filtering
    handleFilterProvince() {
      let newPro = Array.from(this.provinceList)
      for (const val of this.filterProvince) {
        newPro = newPro.filter((vq) => String(vq.id) !== String(val))
      }
      this.provinceList = Array.from(newPro)
    },
    // City-level filtering
    handleFilterCity() {
      let newCity = Array.from(this.cityList)
      for (const val of this.filterCity) {
        newCity = newCity.filter((vq) => String(vq.id) !== String(val))
      }
      this.cityList = Array.from(newCity)
    },
    // County-level filtering
    handleFilterCounty() {
      let newCounty = Array.from(this.countyList)
      for (const val of this.filterCounty) {
        newCounty = newCounty.filter((vq) => String(vq.id) !== String(val))
      }
      this.countyList = Array.from(newCounty)
    },
    // Remove a selected region; params: deleteVal: array of region objects to remove
    deleteCheck(deleteVal) {
      for (const val of deleteVal) {
        const selectId = val.id.split('-')
        const length = selectId.length
        switch (length) {
          case 1: {
            // Length of only 1 means only province-level data; remove the corresponding
            // province from the filter data
            this.filterProvince = this.filterProvince.filter((vs) => vs !== selectId[0])
            // Re-fetch the county-level data
            this.getProvince()
            break
          }
          case 2: {
            // Length of 2 reaches city-level data; remove the corresponding city from the filter data
            this.filterCity = this.filterCity.filter((vs) => vs.toString() !== selectId[1])
            // Re-fetch the city-level data
            if (this.$refs.prov.selectedDistrict.length) {
              // Only show the county level once the province level is checked
              this.checkProvince([this.$refs.city.father])
            }
            break
          }
          case 3: {
            // Length of 3 reaches county-level data; remove the corresponding county from the filter data
            this.filterCounty = this.filterCounty.filter((vs) => vs.toString() !== selectId[2])
            if (this.$refs.city.selectedDistrict.length) {
              // Only show the county level once the city level is checked
              const fatherId = this.$refs.county.father.id.split('-')[1]
              const fatherText = this.$refs.county.father.label.split('-')[1]
              const obj = [{ id: fatherId, label: fatherText }]
              // Re-fetch the county-level data; params: array of objects for the current
              // city id: obj:[{id:id,label:label}]
              this.checkCity(obj)
            }
            break
          }
        }
        // Refresh the selected region
        this.checkedDistrict = this.checkedDistrict.filter((vd) => vd.id !== val.id)
      }
    },
    // Initialize the filters; params: addVal: array of region objects to add
    initFilter(addVal) {
      for (const val of addVal) {
        const selectId = val.id.split('-')
        const length = selectId.length
        switch (length) {
          case 1:
            this.filterProvince.push(selectId[0])
            break
          case 2:
            this.filterCity.push(selectId[1])
            break
          case 3:
            this.filterCounty.push(selectId[2])
            break
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.inner-center {
  margin: 0 5px;
}
</style>
