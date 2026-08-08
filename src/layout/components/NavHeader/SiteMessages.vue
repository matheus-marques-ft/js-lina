<template>
  <div>
    <el-badge
      :hidden="unreadMsgCount === 0"
      :max="99"
      :value="unreadMsgCount"
      size="small"
      type="primary"
    >
      <el-link style="height: 100%" @click="toggleDrawer">
        <svg-icon icon-class="remind" />
      </el-link>
    </el-badge>
    <el-drawer
      v-model="show"
      :before-close="handleClose"
      :modal="true"
      :lock-scroll="false"
      :show-close="false"
      :size="width"
      :title="$tc('SiteMessage')"
      class="site-msg-drawer"
      modal-class="site-msg-modal"
      header-class="site-msg-header"
      body-class="site-msg-body"
      @open="getMessages"
    >
      <template #header="{ close }">
        <span class="msg-header-title">{{ $t('SiteMessage') }}</span>
        <div class="msg-header-right">
          <span
            v-if="unreadMsgCount !== 0"
            class="msg-list-all-read-btn"
            @click.stop="oneClickRead(messages)"
          >
            {{ $t('AllClickRead') }}
          </span>
          <el-icon class="msg-header-close" :title="$t('Close')" @click="close">
            <Close />
          </el-icon>
        </div>
      </template>
      <div v-if="unreadMsgCount !== 0" class="msg-list">
        <div
          v-for="msg of messages"
          :key="msg.id"
          class="msg-item"
          :class="{ 'is-read': msg['has_read'] }"
          @click="showMsgDetail(msg)"
          @mouseleave="hoverMsgId = ''"
          @mouseover="hoverMsgId = msg.id"
        >
          <div class="msg-item__head">
            <span v-if="!msg['has_read']" class="msg-item__dot" />
            <span class="msg-item__subject">{{ msg.content.subject }}</span>
            <span class="msg-item__meta">
              <a
                v-if="hoverMsgId === msg.id && !msg['has_read']"
                class="msg-item__read"
                @click.stop="markAsRead([msg])"
              >
                {{ $t('MarkAsRead') }}
              </a>
              <template v-else>{{ formatDate(msg.date_created) }}</template>
            </span>
          </div>
          <div class="msg-item__preview">{{ stripMarkdown(msg.content.message) }}</div>
        </div>
      </div>
      <div v-else class="msg-empty">
        <svg-icon icon-class="remind" class="msg-empty__icon" />
        <span>{{ $t('NoUnreadMsg') }}</span>
      </div>
    </el-drawer>

    <Dialog
      v-if="msgDetailVisible"
      v-model:visible="msgDetailVisible"
      :close-on-click-modal="false"
      :confirm-title="$tc('MarkAsRead')"
      :title="currentMsg.content.subject"
      @cancel="cancelRead"
      @close="markAsRead([currentMsg])"
      @confirm="markAsRead([currentMsg])"
    >
      <div class="msg-detail">
        <div class="msg-detail-txt">
          <span class="msg-detail-time">{{ formatDate(currentMsg.date_created) }}</span>
          <MarkDown :html="true" :value="currentMsg.content.message" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script>
import Dialog from '@/components/Dialog'
import MarkDown from '@/components/Widgets/MarkDown'
import { toSafeLocalDateStr } from '@/composables/useDateTime'

export default {
  name: 'SiteMessages',
  components: {
    Dialog,
    MarkDown
  },
  data() {
    return {
      show: false,
      messages: [],
      hoverMsgId: '',
      msgDetailVisible: false,
      currentMsg: null,
      unreadMsgCount: 0
    }
  },
  computed: {
    width() {
      return this.$store.state.app.device === 'mobile' ? '70%' : '450px'
    }
  },
  mounted() {
    this.enablePullMsgCount()
  },
  methods: {
    handleClose() {
      this.show = false
    },
    toggleDrawer() {
      this.show = !this.show
    },
    showMsgDetail(msg) {
      this.currentMsg = msg
      this.msgDetailVisible = true
    },
    // List preview: the body is Markdown (ticket-type messages may also contain HTML fragments);
    // strip markup/tags here to get clean plain text for a 1-2 line preview, avoiding exposing
    // raw # / ** like the detail view does.
    stripMarkdown(text) {
      if (!text) return ''
      return String(text)
        .replace(/<[^>]+>/g, ' ') // HTML tags
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // Images
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // Links -> text
        .replace(/^\s{0,3}#{1,6}\s*/gm, '') // Headings
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
        .replace(/\*([^*]+)\*/g, '$1') // Italic
        .replace(/`([^`]+)`/g, '$1') // Inline code
        .replace(/^\s{0,3}>\s?/gm, '') // Blockquote
        .replace(/^\s{0,3}[-*+]\s+/gm, '') // List markers
        .replace(/\s+/g, ' ') // Collapse whitespace
        .trim()
    },
    getMessages() {
      const url = '/api/v1/notifications/site-messages/?offset=0&limit=15&has_read=false'
      this.$axios.get(url).then((resp) => {
        this.messages = [...resp.results]
        this.unreadMsgCount = resp.count
      })
    },
    formatDate(s) {
      if (!s) {
        return ''
      }
      const d = new Date(s)
      const now = new Date()
      if (now.getTime() - d.getTime() > 3600 * 24 * 7 * 1000) {
        return toSafeLocalDateStr(s)
      } else {
        return this.$moment(d).fromNow()
      }
    },
    oneClickRead(msgs) {
      this.$confirm(this.$tc('OneClickReadMsg'), this.$tc('Info'), {
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
        beforeClose: async (action, instance, done) => {
          if (action !== 'confirm') return done()
          this.markAsReadAll(msgs)
          done()
        }
      }).catch(() => {
        /* Cancelled */
      })
    },
    markAsReadAll(msgs) {
      const url = `/api/v1/notifications/site-messages/mark-as-read-all/`
      this.$axios
        .patch(url, {})
        .then((res) => {
          this.msgDetailVisible = false
          this.getMessages()
        })
        .catch((err) => {
          this.$message(err.detail)
        })
    },
    markAsRead(msgs) {
      const url = `/api/v1/notifications/site-messages/mark-as-read/`
      const msgIds = []
      for (const item of msgs) {
        msgIds.push(item.id)
      }
      this.$axios
        .patch(url, { ids: msgIds })
        .then((res) => {
          this.msgDetailVisible = false
          this.getMessages()
        })
        .catch((err) => {
          this.$message(err.detail)
        })
    },
    cancelRead() {
      this.msgDetailVisible = false
    },
    enablePullMsgCount() {
      const scheme = document.location.protocol === 'https:' ? 'wss' : 'ws'
      const port = document.location.port ? ':' + document.location.port : ''
      const url = '/ws/notifications/site-msg/'
      const wsURL = scheme + '://' + document.location.hostname + port + url

      const ws = new WebSocket(wsURL)
      ws.onopen = (event) => {
        this.$log.debug('Websocket connected: ', event)
      }
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.$log.debug('Data: ', data)
          const unreadCount = data['unread_count']
          if (unreadCount !== undefined) {
            this.unreadMsgCount = unreadCount
          }
        } catch (e) {
          this.$log.debug('Recv site message error')
        }
      }
      ws.onerror = (error) => {
        this.$message.error(this.$tc('ConnectWebSocketError'))
        this.$log.debug('site message ws error: ', error)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.el-badge :deep(.el-badge__content.is-fixed) {
  top: 10px;
}

.msg-list {
  padding: 4px 0 12px;
}

// Notification list item: unread dot + title + time/hover action + plain-text preview
.msg-item {
  padding: 12px 24px;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: var(--el-fill-color-light, #f5f7fa);
  }
}

.msg-item__head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 20px;
}

.msg-item__dot {
  flex: 0 0 auto;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
}

.msg-item__subject {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary, #1f2329);
}

.msg-item__meta {
  flex: 0 0 auto;
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
  white-space: nowrap;
}

.msg-item__read {
  color: var(--color-primary);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.msg-item__preview {
  // Align preview with title (leave room for the dot), clamp to two lines
  margin-top: 4px;
  padding-left: 14px;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-secondary, #909399);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

// Read item (usually removed from the unread list on refresh; this is a fallback muted style)
.msg-item.is-read {
  .msg-item__subject {
    font-weight: 400;
    color: var(--el-text-color-regular, #606266);
  }
}

.msg-detail {
  .msg-detail-txt {
    max-height: 70vh;
    overflow-y: auto;
    font-size: 13px;
    line-height: 22px;
    color: var(--N900, #1f2329);

    // Float the time to the top-right of the body, sharing the line with the first title row
    .msg-detail-time {
      float: right;
      margin: 0 0 4px 12px;
      color: var(--el-text-color-secondary, #909399);
      font-size: 12px;
      line-height: 24px;
    }

    // The body is rendered Markdown output (headings / field lists / links); style it below
    // by the resulting tags.
    :deep(.markdown-body) {
      padding: 0;
    }

    // Section headings (# / ##)
    :deep(h1),
    :deep(h2),
    :deep(h3) {
      margin: 16px 0 4px;
      padding: 0;
      border: 0;
      color: var(--neutral-900, #1f2329);
      font-weight: 600;
      line-height: 1.4;
    }

    :deep(h1) {
      margin-top: 0;
      font-size: 15px;
    }

    :deep(h2) {
      font-size: 14px;
    }

    :deep(h3) {
      font-size: 13px;
    }

    :deep(p) {
      margin: 6px 0;
    }

    // Only lists that “start with a bold field name” are laid out as an info table;
    // regular Markdown lists keep their bullet markers.
    :deep(ul:has(> li > strong:first-child)) {
      margin: 6px 0 0;
      padding: 0;
      list-style: none;
    }

    :deep(ul:has(> li > strong:first-child) > li) {
      padding: 9px 2px;
      border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
      line-height: 20px;

      &:last-child {
        border-bottom: none;
      }

      strong {
        display: inline-block;
        min-width: 72px;
        margin-right: 16px;
        color: var(--el-text-color-secondary, #8a9099);
        font-weight: 400;
        vertical-align: top;
      }
    }

    // Links in message content (asset address, view details, etc.) use the unified link color,
    // not --color-success (it renders green under themes like Deep black, which is also
    // semantically wrong). --color-link is blue across all themes, so it stays consistent.
    :deep(a) {
      color: var(--color-link) !important;
      word-break: break-all;
    }
  }
}

.msg-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 20px;
  color: var(--el-text-color-secondary, #909399);
  font-size: 13px;

  .msg-empty__icon {
    width: 40px;
    height: 40px;
    font-size: 40px;
    opacity: 0.3;
  }
}

:deep(:focus) {
  outline: 0;
}
</style>

<style lang="scss">
/*
 * el-drawer teleports to body by default, and EP 2.14 has no customClass and
 * inheritAttrs:false, so header-class/body-class/modal-class are used to inject real class
 * names, matched via a non-scoped global style.
 * modal-class is set to a transparent mask: the mask is kept to support click-outside-to-close,
 * but it doesn't visually dim the page.
 */
.site-msg-modal {
  background-color: transparent !important;
}

/*
 * Site messages are not the generic Drawer component; reusing `.drawer` is avoided to
 * prevent accidentally matching the global drawer's `overflow: hidden` rule. The drawer
 * root locks the viewport height, with body as the sole scroll container.
 */
.site-msg-drawer {
  height: 100%;
  max-height: 100vh;
  overflow: hidden;
}

.site-msg-header.el-drawer__header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  border-bottom: solid 1px rgb(231, 234, 239);
  margin-bottom: 0;
  padding: 10px 20px;
  box-sizing: border-box;
  font-size: 16px;

  .msg-header-title {
    font-size: 16px;
    color: var(--color-text-primary);
  }

  .msg-header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .msg-list-all-read-btn {
    display: inline-flex;
    align-items: center;
    font-size: 12px;
    line-height: 1;
    color: #72767b;
    cursor: pointer;

    &:hover {
      color: var(--color-primary);
    }
  }

  .msg-header-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    font-size: 16px;
    color: #909399 !important;
    cursor: pointer;

    svg {
      width: 16px;
      height: 16px;
    }

    &:hover {
      color: var(--color-primary) !important;
    }
  }
}

.site-msg-body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
}
</style>
