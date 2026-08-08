<template>
  <el-card v-bind="$attrs" :class="'ibox ' + type" :shadow="shadow">
    <template v-if="title" #header>
      <slot name="header">
        <div v-if="title" class="clearfix ibox-title">
          <i v-if="fa" :class="'fa ' + fa" />
          <h5>{{ $t(title) }}</h5>
        </div>
      </slot>
    </template>
    <slot />
  </el-card>
</template>

<script>
export default {
  name: 'IBox',
  props: {
    title: {
      type: String,
      default: () => null
    },
    fa: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'default'
    },
    shadow: {
      type: String,
      default: 'never'
    }
  },
  computed: {
    iClass() {
      return this.type
    }
  }
}
</script>

<style lang="scss" scoped>
/*
 * Unified convention:
 * - The card's direct outer wrapper (.ibox / .el-card) sets no padding at all; all padding
 *   lives on __body / __header.
 * - __body uses a uniform flex column layout, with 20px left/right padding.
 * - __header likewise has 20px left/right padding.
 * Special cases (edge-to-edge tables, detail-page quick-update, full-height stretch) are
 * overridden by each component's own deep selectors.
 */
.ibox {
  clear: both;
  padding: 0;
}

.ibox :deep(.el-card__header) {
  border-color: #e7eaec;
  border-image: none;
  margin-bottom: 0;
  padding: 10px 20px;
  min-height: 30px;
  line-height: 1.32;
  font-weight: normal;
}

.ibox-title {
  display: flex;
  align-items: center;
}

// Spacing is attached to the icon (only present when there is an icon) rather than a
// container-level gap, to avoid the ambiguity of "reserving" a gap even when there's no icon
.ibox-title > .fa {
  margin-right: 8px;
}

// After the icon migration, the glyph (::before) of <i class="fa fa-xxx"> has been removed,
// so these fa icons are actually invisible empty elements (:empty), yet they still occupy the
// margin above, resulting in "an empty gap where there's no icon". Directly hide fa icons that
// render no content (along with their margin); icons with real content are unaffected.
.ibox-title > .fa:empty {
  display: none;
}

.ibox-title h5 {
  display: inline-block;
  font-size: 13px;
  margin: 0;
  padding: 0;
  text-overflow: ellipsis;
  font-weight: 500;
}

.ibox-tools a {
  cursor: pointer;
  margin-left: 5px;
  color: #c4c4c4;
}

.ibox-tools {
  display: block;
  float: none;
  margin-top: 0;
  position: relative;
  padding: 0;
  text-align: right;
}

.fa {
  font-size: 14px;
}

.ibox :deep(.el-card__body) {
  padding: 20px;
  display: flex;
  flex-direction: column;
  color: var(--color-icon-primary);
}
</style>
