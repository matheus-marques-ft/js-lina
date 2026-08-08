<template>
  <div id="app">
    <!-- Use key instead of v-if to force router-view to re-render, avoiding a DOM insertBefore error caused by fully unmounting the root node -->
    <router-view :key="isRouterAlive" />
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import { Watermark } from 'watermark-js-plus'
import { IS_DEV } from '@/utils/env'

export default {
  name: 'App',
  data() {
    return {
      watermark: null
    }
  },
  computed: {
    ...mapState({
      isRouterAlive: (state) => state.common.isRouterAlive
    }),
    ...mapGetters({
      currentUser: 'currentUser',
      publicSettings: 'publicSettings'
    })
  },
  watch: {
    currentUser: {
      handler(newVal) {
        this.createWatermark()
      }
    },
    'publicSettings.SECURITY_WATERMARK_ENABLED': {
      handler(newVal) {
        if (!newVal) {
          return setTimeout(() => {
            this.watermark?.destroy()
            this.watermark = null
          })
        }

        this.createWatermark()
      }
    }
  },
  // Vue 3 error capture hook - catches child component errors, preventing the whole app from crashing
  errorCaptured(err, instance, info) {
    // Print detailed error info in dev environment
    if (IS_DEV) {
      console.error('Error Captured in App:', err)
      console.error('Component instance:', instance)
      console.error('Error info:', info)
    } else {
      console.error('Component Error:', err?.message || err)
    }

    // Try to show a friendly error message
    try {
      if (this.$message && typeof this.$message.error === 'function') {
        this.$message.error(err?.message || 'Component failed to load, please refresh the page and try again')
      }
    } catch (e) {
      // Ignore if the message service is unavailable
    }

    // Returning false would stop the error from propagating further
    // but we return true here so the global error handler can also process it
    return true
  },
  methods: {
    getWaterMarkFields() {
      const user = this.currentUser
      const userId = user?.id || ''
      const name = user?.name || ''
      const userName = user?.username || ''
      const currentTime = this.$moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
      return { userId, name, userName, currentTime }
    },
    getWaterMarkContent() {
      const fields = this.getWaterMarkFields()
      const template = this.publicSettings.SECURITY_WATERMARK_CONSOLE_CONTENT || ''
      return template.replace(/\${([^}]+)}/g, (_, variableName) => {
        const key = variableName.trim()
        return fields[key] !== undefined ? fields[key] : 'N/A'
      })
    },

    createWatermark() {
      if (this.currentUser?.username && this.publicSettings?.SECURITY_WATERMARK_ENABLED) {
        this.watermark = new Watermark({
          content: this.getWaterMarkContent(),
          width: this.publicSettings?.SECURITY_WATERMARK_WIDTH,
          height: this.publicSettings?.SECURITY_WATERMARK_HEIGHT,
          rotate: this.publicSettings?.SECURITY_WATERMARK_ROTATE,
          fontWeight: 'normal',
          fontSize: this.publicSettings?.SECURITY_WATERMARK_FONT_SIZE + 'px',
          fontColor: this.publicSettings?.SECURITY_WATERMARK_COLOR,
          contentType: 'multi-line-text',
          lineHeight: this.publicSettings?.SECURITY_WATERMARK_FONT_SIZE
        })
        this.watermark.create()
      }
    }
  }
}
</script>
