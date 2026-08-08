import { computed } from 'vue'

/**
 * useVModel - a composable that simplifies passing v-model props
 *
 * Usage:
 * import { useVModel } from '@/utils/vue/useVModel'
 *
 * setup(props, { emit }) {
 *   const iVisible = useVModel(props, emit, 'visible')
 *   // can be used directly with v-model:
 *   // <Drawer v-model:visible="iVisible" />
 * }
 *
 * @param {Object} props - the component props
 * @param {Function} emit - the component emit function
 * @param {string} propName - the prop name, e.g. 'visible'
 * @param {string} eventName - the event name, defaults to 'update:${propName}'
 * @returns {import('vue').WritableComputedRef}
 */
export function useVModel(props, emit, propName, eventName) {
  const updateEventName = eventName || `update:${propName}`

  return computed({
    get() {
      return props[propName]
    },
    set(value) {
      emit(updateEventName, value)
    }
  })
}

export default useVModel
