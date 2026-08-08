<template>
  <div class="wrapper-content">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'PageContent'
}
</script>

<style scoped>
.wrapper-content {
  padding: 12px 20px 22px 20px;
  box-sizing: border-box;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/*
 * Content components often wrap multiple blocks in a single <div> (no class, or class=""),
 * which becomes the only flex child of .wrapper-content, causing the outer gap to have no
 * effect on its inner blocks. Page's slot isn't wrapped in a transition, so for this kind of
 * purely structural wrapper, display: contents makes it transparent in layout terms: its
 * children become direct flex items of .wrapper-content, siblings of .page-alert, and pick
 * up the outer gap directly. Wrappers with a class have their own styles and are left as-is.
 */
.wrapper-content > :deep(div:not([class])),
.wrapper-content > :deep(div[class='']) {
  display: contents;
}

/*
 * Unified principle: cards themselves never show an inner scrollbar; only the outer
 * .wrapper-content (page-content) scrolls as a whole. Card-related containers are forced to
 * not have their own scroll / max-height, handing overflow back to the outer scroll container.
 */
.wrapper-content :deep(.el-card__body),
.wrapper-content :deep(.ibox),
.wrapper-content :deep(.el-card) {
  overflow: visible !important;
  max-height: none !important;
}

.wrapper-content :deep(.page-alert) {
  margin: 0;
}

/*
 * Unify the font size / icon size of page-level el-alert (including hand-written el-alert on
 * settings pages) so it matches the .page-alert rendered via help-tip in console. Tips inside
 * forms (within .el-form / .help-block) have their own styles and are excluded.
 */
.wrapper-content :deep(.el-alert:not(.help-warning)) {
  margin: 0;
}

.wrapper-content :deep(.page-alert .el-alert__icon),
.wrapper-content :deep(.page-alert .el-alert__icon .el-icon),
.wrapper-content :deep(.page-alert .el-alert__icon .el-icon svg),
.wrapper-content :deep(.el-alert:not(.help-warning) .el-alert__icon),
.wrapper-content :deep(.el-alert:not(.help-warning) .el-alert__icon .el-icon),
.wrapper-content :deep(.el-alert:not(.help-warning) .el-alert__icon .el-icon svg) {
  width: 16px;
  height: 16px;
  font-size: 16px;
}

.wrapper-content :deep(.page-alert .el-alert__title),
.wrapper-content :deep(.page-alert .el-alert__description),
.wrapper-content :deep(.page-alert .el-alert__content),
.wrapper-content :deep(.page-alert .el-alert__description p),
.wrapper-content :deep(.page-alert .el-alert__content p),
.wrapper-content :deep(.page-alert .el-alert__content span),
.wrapper-content :deep(.page-alert .announcement-main),
.wrapper-content :deep(.el-alert:not(.help-warning) .el-alert__title),
.wrapper-content :deep(.el-alert:not(.help-warning) .el-alert__description),
.wrapper-content :deep(.el-alert:not(.help-warning) .el-alert__content),
.wrapper-content :deep(.el-alert:not(.help-warning) .el-alert__content p),
.wrapper-content :deep(.el-alert:not(.help-warning) .el-alert__content span) {
  font-size: 12px !important;
  line-height: 1.5;
}

.wrapper-content :deep(.page-alert .el-alert__closebtn),
.wrapper-content :deep(.el-alert:not(.help-warning) .el-alert__closebtn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 16px;
}
</style>
