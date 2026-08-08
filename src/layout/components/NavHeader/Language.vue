<template>
  <el-dropdown popper-class="nav-header-dropdown">
    <span class="el-dropdown-link header-lang">
      {{ currentLang.title }}<el-icon class="el-icon--right"><ArrowDown /></el-icon>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="item of supportLanguages"
          :key="item.code"
          @click="changeLangTo(item)"
        >
          {{ item.title }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script>
import { getLangCode } from '@/i18n/utils'
import store from '@/store'

export default {
  name: 'Language',
  data() {
    return {
      langCookeName: 'django_language', // The COOKIE KEY required by the backend Django
      supportLanguages: [],
      defaultLang: {
        title: 'English',
        code: 'en',
        cookieCode: 'en'
      }
    }
  },
  computed: {
    supportedLangMapper() {
      return this.supportLanguages.reduce((map, obj) => {
        map[obj.code] = obj
        return map
      }, {})
    },
    currentLang() {
      const lang = getLangCode(true)
      return this.supportedLangMapper[lang] || this.defaultLang
    }
  },
  mounted() {
    this.supportLanguages = store.getters.publicSettings['LANGUAGES'].map((item) => {
      return {
        title: item.name,
        code: item.code,
        cookieCode: item.code
      }
    })
    this.changeMomentLang()
  },
  methods: {
    changeMomentLang() {
      const lang = getLangCode()
      this.$moment.locale(lang)
      document.documentElement.lang = lang
    },
    changeLangTo(item) {
      this.$axios.get(`/core/i18n/${item.cookieCode}/`).finally(() => {
        window.location.reload()
      })
    }
  }
}
</script>

<style scoped>
.header-lang {
  color: white;
  cursor: pointer;
  /* When the el-dropdown trigger is focused (clicked), the browser/EP draws an outline ring, which
  looks out of place on the dark top bar background, so remove it. */
  outline: none;
}

.header-lang:focus,
.header-lang:focus-visible {
  outline: none;
}
</style>
