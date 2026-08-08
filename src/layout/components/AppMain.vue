<template>
  <section class="app-main">
    <CachedRouterView />

    <ChatGPT v-if="chatAiEnabled" />
  </section>
</template>

<script>
import ChatGPT from '@/components/Apps/ChatAi'
import { mapGetters } from 'vuex'
import CachedRouterView from '@/layout/components/CachedRouterView.vue'

export default {
  name: 'AppMain',
  components: {
    CachedRouterView,
    ChatGPT
  },
  computed: {
    ...mapGetters(['publicSettings']),
    chatAiEnabled() {
      return this.publicSettings?.CHAT_AI_ENABLED
    }
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.app-main {
  background-color: #f3f3f4;
  height: 100%;
  //height: 100vh !important;
  width: 100%;
  position: relative;
  overflow: auto;
  /*padding: 10px 20px 10px;*/
}

// Note: .main-container is already shifted down as a whole via `position: relative; top: $headerHeight`
// (see styles/sidebar.scss) to clear the fixed header, so we **must not** add padding-top here again,
// otherwise it would be shifted down twice by $headerHeight, leaving a blank gap below the header
// (right-clicking there would only hit app-wrapper, since that's the app-main padding area).
.fixed-header + .app-main {
  padding-top: 0;
}

.hasTagsView {
  .app-main {
    /* navbar + tags-view = $headerHeight + 34 */
    min-height: calc(100vh - #{$headerHeight} - 34px);
  }

  // tags-view is 34px tall; main-container is already offset by $headerHeight, so we only need to add the tags-view height here
  .fixed-header + .app-main {
    padding-top: 34px;
  }
}
</style>
