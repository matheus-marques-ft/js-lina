<template>
  <div class="box">
    <div style="margin-bottom: 12px">
      <Title :config="config" />
    </div>
    <div class="content">
      <SummaryCard
        v-for="item of items"
        :key="item.title"
        :title="item.title"
        class="summary-card"
        v-bind="item.body"
      />
    </div>
  </div>
</template>

<script>
import Title from './Title.vue'
import SummaryCard from '@/components/Cards/SummaryCard'

export default {
  components: { Title, SummaryCard },
  props: {
    config: {
      type: Object,
      default: () => {
        return {
          title: '',
          tip: ''
        }
      }
    },
    items: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {}
  }
}
</script>

<style lang="scss" scoped>
.box {
  padding: 20px;
  background: #ffffff;

  .content {
    display: flex;
    justify-content: space-between;
    padding: 0 10px;

    .summary-card {
      // Flex items default to min-width: auto, i.e. their content's min-content size - and
      // SummaryCard's title uses white-space: nowrap (for its ellipsis truncation), so a
      // long title's min-content size is its FULL unwrapped width. Without this override,
      // the browser refuses to shrink the card below that width, blowing this one card up
      // and breaking the row's responsiveness whenever a title is much longer than its
      // siblings (e.g. "Quantidade de logs de modificação de senha").
      flex: 1 1 0;
      min-width: 0;
      padding-left: 16px;
      border-left: 1px solid #eff0f1;

      &:first-child {
        padding-left: 0;
        border-left: none;
      }
    }
  }
}
</style>
