import { optionUrlMeta } from '@/api/common'

const getDefaultState = () => {
  return {
    isRouterAlive: true,
    sqlQueryCounter: [],
    showSqlQueryCounter: true,
    confirmDialogVisible: false,
    drawerActionMeta: {},
    successActionMeta: {},
    inDrawer: false
  }
}

const state = getDefaultState()

const mutations = {
  reload: (state) => {
    // Force router-view to re-render by toggling the key, avoiding the DOM insertion errors caused by using v-if to repeatedly destroy/recreate the root node
    state.isRouterAlive = !state.isRouterAlive
  },
  addSQLQueryCounter: (state, { url, count }) => {
    if (count < 5) {
      return
    }
    state.sqlQueryCounter = state.sqlQueryCounter.filter((item) => item.url !== url)
    state.sqlQueryCounter.push({ url, count, time: new Date().getTime() })
    if (state.sqlQueryCounter.length > 5) {
      state.sqlQueryCounter.shift()
    }
  },
  setConfirmDialogVisible: (state, show) => {
    state.confirmDialogVisible = show
  }
}

const actions = {
  getUrlMeta(_, { url }) {
    return optionUrlMeta(url)
  },
  digestSQLQuery({ commit, state }, resp) {
    if (!resp || !resp.status.toString().startsWith('20')) {
      return
    }
    let url = resp.config.url
    if (url.indexOf('?') > 0) {
      url = url.substring(0, url.indexOf('?'))
    }
    url = url.replace('/api/v1', '')
    if (url.endsWith('/')) {
      url = url.substring(0, url.length - 1)
    }
    let sqlCount = resp.headers['x-jms-sql-count']
    sqlCount -= 2
    if (!sqlCount || sqlCount < 3) {
      return
    }
    commit('addSQLQueryCounter', { url, count: sqlCount })
  },
  showConfirmDialog({ commit, state }, show) {
    commit('setConfirmDialogVisible', show)
  },
  showSqlQueryCounter({ commit, state }, show) {
    state.showSqlQueryCounter = show
  },
  setDrawerActionMeta({ commit, state }, meta) {
    state.drawerActionMeta = meta
    state.inDrawer = true
  },
  getDrawerActionMeta({ commit, state }) {
    return state.drawerActionMeta
  },
  cleanDrawerActionMeta({ commit, state }) {
    state.drawerActionMeta = {}
    state.inDrawer = false
  },
  finishDrawerActionMeta({ commit, state }, payload) {
    state.successActionMeta = payload
    state.drawerActionMeta = {}
    state.inDrawer = false
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
