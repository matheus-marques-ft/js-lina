<template>
  <div>
    <span :class="iClasses">
      <i v-if="iIcon" :class="'fa ' + iIcon" />
    </span>
    <span v-if="iText"> {{ iText }} </span>
  </div>
</template>

<script>
export default {
  props: {
    value: {
      type: [String, Boolean],
      default: () => false
    },
    trueText: {
      type: String,
      default: function () {
        return 'Yes'
      }
    },
    falseText: {
      type: String,
      default: function () {
        return 'No'
      }
    },
    trueIcon: {
      type: String,
      default: function () {
        return 'fa-check-circle'
      }
    },
    falseIcon: {
      type: String,
      default: function () {
        return ''
      }
    }
  },
  data() {
    return {}
  },
  computed: {
    iText() {
      const text = this.value ? this.trueText : this.falseText
      // trueText/falseText default to 'Yes'/'No' and go through i18n translation
      // (the backend-provided translations have been merged into vue-i18n);
      // when the key is missing, $t returns it as-is, which doesn't affect custom text
      return text ? this.$t(text) : text
    },
    iIcon() {
      return this.value ? this.trueIcon : this.falseIcon
    },
    iClasses() {
      return this.value ? 'text-primary' : ''
    }
  }
}
</script>

<style scoped></style>
