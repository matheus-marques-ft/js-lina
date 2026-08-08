import { IS_DEV } from '@/utils/env'

/**
 * Global error handler
 * Prevents uncaught errors in Vue 3 from crashing the entire application
 *
 * @param {Object} app - Vue application instance
 * @param {Object} message - Message notification service object
 */
export function setupErrorHandler(app, message) {
  app.config.errorHandler = (err, instance, info) => {
    // Print detailed error info in the development environment
    if (IS_DEV) {
      console.error('Global Error Handler:', err)
      console.error('Component instance:', instance)
      console.error('Error info:', info)
    } else {
      // In production, only print the error message, not the component instance
      console.error('Application Error:', err?.message || err)
      console.error('Error info:', info)
    }

    // Try to show a friendly error message
    try {
      // Use the provided message function
      if (message && typeof message.error === 'function') {
        message.error(err?.message || 'An error occurred. Please refresh the page.')
      } else {
        // If message is unavailable, at least log to the console
        console.error('Error details:', err)
      }
    } catch (e) {
      // Ignore if the message service is unavailable
      console.error('Failed to show error message:', e)
    }

    // Do not rethrow the error, to prevent the app from crashing entirely
    // This way, even if one component errors out, the rest can still render normally
  }
}
