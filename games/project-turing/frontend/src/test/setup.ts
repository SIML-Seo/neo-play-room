import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Firebase in tests
vi.mock('@/firebase', () => ({
  auth: {},
  database: {},
  firestore: {},
  functions: {},
}))

// Extend vitest expect with jest-dom matchers
expect.extend({})
