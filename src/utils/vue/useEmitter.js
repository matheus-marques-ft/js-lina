import { provide, inject } from 'vue'

const EMITTER_KEY = Symbol('emitter')

/**
 * useEmitter - a composable for communication between components
 * Replaces the Emitter mixin (the old pattern based on $children/$parent)
 *
 * Usage:
 * // parent component
 * import { useProvideEmitter } from '@/utils/vue/useEmitter'
 * setup() {
 *   useProvideEmitter()
 * }
 *
 * // child component
 * import { useInjectEmitter } from '@/utils/vue/useEmitter'
 * setup() {
 *   const emitter = useInjectEmitter()
 *   emitter.dispatch('ComponentName', 'eventName', data)
 * }
 */

/**
 * Used in the parent component to provide the emitter functionality
 */
export function useProvideEmitter() {
  const listeners = new Map()

  function on(componentName, eventName, callback) {
    const key = `${componentName}:${eventName}`
    if (!listeners.has(key)) {
      listeners.set(key, [])
    }
    listeners.get(key).push(callback)
  }

  function off(componentName, eventName, callback) {
    const key = `${componentName}:${eventName}`
    if (listeners.has(key)) {
      const callbacks = listeners.get(key)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  function emit(componentName, eventName, ...args) {
    const key = `${componentName}:${eventName}`
    if (listeners.has(key)) {
      listeners.get(key).forEach((callback) => callback(...args))
    }
  }

  const emitter = { on, off, emit }
  provide(EMITTER_KEY, emitter)

  return emitter
}

/**
 * Used in the child component to inject the emitter functionality
 */
export function useInjectEmitter() {
  const emitter = inject(EMITTER_KEY, null)
  if (!emitter) {
    console.warn('[useEmitter] No emitter provided by parent component')
  }
  return emitter
}

/**
 * Look upward for the specified component and send an event
 * Replaces the dispatch method
 */
export function useDispatch() {
  const emitter = useInjectEmitter()

  function dispatch(componentName, eventName, ...args) {
    if (emitter) {
      emitter.emit(componentName, eventName, ...args)
    }
  }

  return { dispatch }
}

/**
 * Broadcast an event downward to the specified component
 * Replaces the broadcast method
 */
export function useBroadcast() {
  const emitter = useInjectEmitter()

  function broadcast(componentName, eventName, ...args) {
    if (emitter) {
      emitter.emit(componentName, eventName, ...args)
    }
  }

  return { broadcast }
}

export default {
  useProvideEmitter,
  useInjectEmitter,
  useDispatch,
  useBroadcast
}
