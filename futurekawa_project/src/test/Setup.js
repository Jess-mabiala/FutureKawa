import '@testing-library/jest-dom'

// Mock global fetch pour tous les tests
global.fetch = vi.fn()

// Reset fetch mock avant chaque test
beforeEach(() => {
  vi.clearAllMocks()
})