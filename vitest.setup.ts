import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Unmount any rendered component between tests so DOM nodes (and event
// listeners) from one test don't leak into the next. Only matters for
// jsdom-environment component tests; a no-op for node-environment API tests.
afterEach(() => {
  cleanup()
})
