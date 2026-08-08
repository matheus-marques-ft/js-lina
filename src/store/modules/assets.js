import { getCategoryTypes as apiGetCategoryTypes } from '@/api/asset'
import request from '@/utils/request'
import { scopedLocalStorage as localStorage } from '@/utils/storage'

const state = {
  assetCategories: [],
  assetCategoriesDropdown: [],
  assetCategoriesCascader: [],
  platforms: [],
  platformGetting: false,
  recentPlatformIds: JSON.parse(localStorage.getItem('recentPlatforms')) || []
}

let isFetchingPlatforms = false

const mutations = {
  SET_CATEGORIES: (state, categories) => {
    state.assetCategories = categories
    state.assetCategoriesCascader = categories.map((category) => {
      category['children'] = category['types']
      return category
    })
  },
  SET_CATEGORIES_DROPDOWN: (state, categories) => {
    const dropdown = []
    for (const category of categories) {
      category.children.forEach((type, index) => {
        const option = {
          name: type.value,
          title: type.label,
          type: 'primary',
          category: category.value,
          has: true
        }
        if (index === 0) {
          option.group = category.label
        }
        dropdown.push(option)
      })
    }
    state.assetCategoriesDropdown = dropdown
  }
}

const actions = {
  getAssetCategories({ commit, dispatch, state }) {
    return new Promise((resolve) => {
      if (state.assetCategories.length > 0) {
        resolve(state)
      }
      apiGetCategoryTypes().then((data) => {
        commit('SET_CATEGORIES', data)
        commit('SET_CATEGORIES_DROPDOWN', data)
        resolve(state)
      })
    })
  },
  getPlatforms({ commit, dispatch, state }) {
    return new Promise((resolve, reject) => {
      if (state.platforms.length > 0) {
        // If data already exists, return it directly
        resolve(state.platforms)
        return
      }

      if (isFetchingPlatforms) {
        // If a request is already in flight, wait for it to finish before returning
        const checkInterval = setInterval(() => {
          if (!isFetchingPlatforms) {
            clearInterval(checkInterval)
            resolve(state.platforms)
          }
        }, 50)
        return
      }

      // Set the flag to indicate a request is in flight
      isFetchingPlatforms = true

      request
        .get('/api/v1/assets/platforms/')
        .then((data) => {
          state.platforms = data
          isFetchingPlatforms = false // Request finished, reset the flag
          resolve(data)
        })
        .catch((error) => {
          isFetchingPlatforms = false // Also reset the flag if the request fails
          reject(error)
        })
    })
  },
  cleanPlatforms({ commit, dispatch, state }) {
    state.platforms = []
  },
  addToRecentPlatforms({ commit, display, state }, platform) {
    const recentPlatformIds = state.recentPlatformIds.filter((i) => i !== platform.id)
    recentPlatformIds.unshift(platform.id)
    if (recentPlatformIds.length > 8) {
      recentPlatformIds.pop()
    }
    state.recentPlatformIds = [...recentPlatformIds]
    localStorage.setItem('recentPlatforms', JSON.stringify(recentPlatformIds))
  },
  getRecentPlatforms({ commit, dispatch, state }) {
    const recentPlatformIds = state.recentPlatformIds
    return new Promise((resolve) => {
      dispatch('getPlatforms').then((platforms) => {
        const platformsMap = {}
        platforms.forEach((p) => {
          platformsMap[p.id] = p
        })
        const recentPlatforms = recentPlatformIds.map((id) => platformsMap[id]).filter((p) => p)
        resolve(recentPlatforms)
      })
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
