<template>
  <el-row :gutter="gutter">
    <template v-if="$slots.right">
      <!-- Default slot content -->
      <el-col :md="left" :sm="24">
        <slot />
      </el-col>
      <!-- Right-side slot -->
      <el-col :md="right" :sm="24">
        <slot name="right" />
      </el-col>
    </template>
    <template v-else>
      <!-- Default slot content, full width -->
      <el-col :md="single" :offset="(24 - single) / 2" :sm="24">
        <slot />
      </el-col>
    </template>
  </el-row>
</template>

<script>
export default {
  name: 'TwoCol',
  components: {},
  props: {
    gutter: {
      type: Number,
      default: 10
    },
    left: {
      type: Number,
      default: 14
    },
    right: {
      type: Number,
      default: 10
    },
    single: {
      type: Number,
      default: 24
    }
  }
}
</script>

<style lang="scss" scoped></style>
