import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCountryOverview } from '../hooks/useCountryOverview'

// Mock du module hqApi
vi.mock('../api/Hqclient', () => ({
  hqApi: {
    getHealth: vi.fn(),
    getLotsByCountry: vi.fn(),
    getAlertsByCountry: vi.fn(),
    getLatestReadings: vi.fn(),
  },
}))

import { hqApi } from '../api/Hqclient'

const makeLot = (warehouseId, warehouseName, exploitationName) => ({
  id: 1,
  lotCode: 'BR-LOT-001',
  warehouseId,
  warehouseName,
  exploitationName,
  storageDate: '2024-01-01',
  status: 'compliant',
})

const makeReading = (temp, hum) => ({
  id: 1,
  temperature: temp,
  humidity: hum,
  recordedAt: new Date().toISOString(),
  isAnomaly: false,
})

describe('useCountryOverview', () => {

  beforeEach(() => {
    vi.clearAllMocks()
    hqApi.getHealth.mockResolvedValue({ brazil: 'ok', ecuador: 'ok', colombia: 'ok' })
    hqApi.getLotsByCountry.mockResolvedValue([makeLot(1, 'Entrepôt BR-1', 'Exploitation Amazônia')])
    hqApi.getAlertsByCountry.mockResolvedValue([])
    hqApi.getLatestReadings.mockResolvedValue([makeReading(29, 55)])
  })

  it('démarre en état loading', () => {
    const { result } = renderHook(() => useCountryOverview(100000))
    expect(result.current.loading).toBe(true)
  })

  it('charge les données des 3 pays après le premier fetch', async () => {
    const { result } = renderHook(() => useCountryOverview(100000))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.overview).toHaveProperty('brazil')
    expect(result.current.overview).toHaveProperty('ecuador')
    expect(result.current.overview).toHaveProperty('colombia')
  })

  it('marque un pays comme unavailable si son API échoue', async () => {
    hqApi.getLotsByCountry.mockImplementation((country) => {
      if (country === 'brazil') throw new Error('Backend indisponible')
      return Promise.resolve([])
    })

    const { result } = renderHook(() => useCountryOverview(100000))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.overview.brazil.status).toBe('unavailable')
    expect(result.current.overview.ecuador.status).toBe('ok')
    expect(result.current.overview.colombia.status).toBe('ok')
  })

  it('dérive correctement les entrepôts depuis les lots', async () => {
    hqApi.getLotsByCountry.mockImplementation((country) => {
      if (country === 'brazil') {
        return Promise.resolve([
          makeLot(1, 'Entrepôt BR-1', 'Exploitation Amazônia'),
          makeLot(2, 'Entrepôt BR-2', 'Exploitation Cerrado'),
        ])
      }
      return Promise.resolve([])
    })

    const { result } = renderHook(() => useCountryOverview(100000))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.overview.brazil.warehouses).toHaveLength(2)
  })

  it('expose une fonction refresh()', async () => {
    const { result } = renderHook(() => useCountryOverview(100000))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(typeof result.current.refresh).toBe('function')
  })

  it('nettoie le polling au démontage du composant', async () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
    const { unmount } = renderHook(() => useCountryOverview(100))

    await waitFor(() => {})
    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
  })
})