import { vi } from 'vitest'

// Firebase Auth Mock
export const mockAuth = {
  currentUser: null,
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
}

export const mockGoogleAuthProvider = {
  setCustomParameters: vi.fn(),
}

export const mockSignInWithPopup = vi.fn()

// Firebase Database Mock
export const mockDatabase = {
  ref: vi.fn(),
  push: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  onValue: vi.fn(),
  off: vi.fn(),
}

// Firebase Firestore Mock
export const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
}

// Firebase Functions Mock
export const mockFunctions = {
  httpsCallable: vi.fn(),
}

// Mock firebase module
vi.mock('@/firebase', () => ({
  auth: mockAuth,
  database: mockDatabase,
  firestore: mockFirestore,
  functions: mockFunctions,
}))
