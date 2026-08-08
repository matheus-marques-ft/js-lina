/**
 * vModelMixin - a mixin that simplifies passing v-model props
 *
 * Usage:
 * import vModelMixin from '@/utils/vue/vModelMixin'
 *
 * export default {
 *   mixins: [vModelMixin('visible')],
 *   // automatically generates an iVisible computed property, which can be used
 *   // directly with v-model:
 *   // <Drawer v-model:visible="iVisible" />
 * }
 *
 * Or use multiple props:
 * mixins: [
 *   vModelMixin('visible'),
 *   vModelMixin('value', 'update:modelValue', 'iValue')
 * ]
 *
 * @param {string} propName - the prop name, e.g. 'visible'
 * @param {string} eventName - the event name, defaults to 'update:${propName}'
 * @param {string} computedName - the computed property name, defaults to
 *   'i${PropName}' (with the first letter capitalized)
 */
export default function vModelMixin(propName, eventName, computedName) {
  const updateEventName = eventName || `update:${propName}`
  // Generate the computed property name, e.g. visible -> iVisible, value -> iValue
  const computedPropName =
    computedName || `i${propName.charAt(0).toUpperCase() + propName.slice(1)}`

  return {
    computed: {
      [computedPropName]: {
        get() {
          return this[propName]
        },
        set(value) {
          this.$emit(updateEventName, value)
        }
      }
    }
  }
}
