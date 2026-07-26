import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hqApi } from '../api/Hqclient'

// Helper : mock fetch avec une réponse JSON
function mockFetch(data, status = 200) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  })
}

// Helper : mock fetch avec une erreur réseau
function mockFetchNetworkError() {
  global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
}

describe('hqApi — Client HTTP backend central', () => {

  describe('getConsolidation()', () => {
    it('appelle la bonne route et retourne les données', async () => {
      const fakeData = [{ country: 'brazil', status: 'ok', lots: [] }]
      mockFetch(fakeData)

      const result = await hqApi.getConsolidation()

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/central/consolidation'),
        expect.any(Object)
      )
      expect(result).toEqual(fakeData)
    })
  })

  describe('getAllLots()', () => {
    it('appelle /api/central/lots et retourne la liste', async () => {
      const lots = [{ id: 1, lotCode: 'BR-LOT-001' }]
      mockFetch(lots)

      const result = await hqApi.getAllLots()

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/central/lots'),
        expect.any(Object)
      )
      expect(result).toEqual(lots)
    })
  })

  describe('getLotsByCountry()', () => {
    it('appelle la route avec le bon pays', async () => {
      mockFetch([])

      await hqApi.getLotsByCountry('brazil')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/central/lots/brazil'),
        expect.any(Object)
      )
    })
  })

  describe('getAlertsByCountry()', () => {
    it('appelle la route alertes du pays', async () => {
      mockFetch([])

      await hqApi.getAlertsByCountry('ecuador')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/central/alerts/ecuador'),
        expect.any(Object)
      )
    })
  })

  describe('getLatestReadings()', () => {
    it('appelle la route relevés avec pays et entrepôt', async () => {
      mockFetch([])

      await hqApi.getLatestReadings('colombia', 2)

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/central/readings/colombia/warehouse/2'),
        expect.any(Object)
      )
    })
  })

  describe('Gestion des erreurs réseau', () => {
    it('lève une ApiError si le réseau est indisponible', async () => {
      mockFetchNetworkError()

      await expect(hqApi.getConsolidation()).rejects.toThrow()
    })
  })

  describe('Gestion des erreurs HTTP 5xx', () => {
    it('lève une ApiError si le serveur répond 500', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Erreur serveur' }),
      })

      await expect(hqApi.getConsolidation()).rejects.toThrow()
    })
  })
})