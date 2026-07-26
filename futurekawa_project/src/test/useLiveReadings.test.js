import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useLiveReadings } from '../hooks/Uselivereadings'

vi.mock('../api/Hqclient', () => ({
  hqApi: {
    getLatestReadings: vi.fn(),
  },
}))

import { hqApi } from '../api/Hqclient'

const makeReading = (id, temp, hum, minutesAgo = 0) => ({
  id,
  temperature: temp,
  humidity: hum,
  recordedAt: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
  isAnomaly: false,
})

describe('useLiveReadings', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ne fait pas d\'appel si country est absent', async () => {
    renderHook(() => useLiveReadings(null, 1, 100000))
    await waitFor(() => {})
    expect(hqApi.getLatestReadings).not.toHaveBeenCalled()
  })

  it('ne fait pas d\'appel si warehouseId est absent', async () => {
    renderHook(() => useLiveReadings('brazil', null, 100000))
    await waitFor(() => {})
    expect(hqApi.getLatestReadings).not.toHaveBeenCalled()
  })

  it('charge les relevés au montage', async () => {
    hqApi.getLatestReadings.mockResolvedValue([makeReading(1, 29, 55)])

    const { result } = renderHook(() => useLiveReadings('brazil', 1, 100000))

    await waitFor(() => expect(result.current.readings).toHaveLength(1))

    expect(hqApi.getLatestReadings).toHaveBeenCalledWith('brazil', 1)
  })

  it('identifie correctement le relevé le plus récent', async () => {
    const readings = [
      makeReading(1, 28, 54, 10), // il y a 10 min
      makeReading(2, 30, 56, 2),  // il y a 2 min — le plus récent
      makeReading(3, 27, 53, 20), // il y a 20 min
    ]
    hqApi.getLatestReadings.mockResolvedValue(readings)

    const { result } = renderHook(() => useLiveReadings('brazil', 1, 100000))

    await waitFor(() => expect(result.current.latest).not.toBeNull())

    expect(result.current.latest.id).toBe(2)
    expect(result.current.latest.temperature).toBe(30)
  })

  it('gère une erreur réseau sans planter', async () => {
    hqApi.getLatestReadings.mockRejectedValue(new Error('Réseau indisponible'))

    const { result } = renderHook(() => useLiveReadings('brazil', 1, 100000))

    await waitFor(() => expect(result.current.error).not.toBeNull())

    expect(result.current.readings).toHaveLength(0)
    expect(result.current.latest).toBeNull()
  })

  it('nettoie l\'intervalle au démontage', async () => {
    hqApi.getLatestReadings.mockResolvedValue([])
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')

    const { unmount } = renderHook(() => useLiveReadings('brazil', 1, 100))

    await waitFor(() => {})
    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('relance le fetch si warehouseId change', async () => {
    hqApi.getLatestReadings.mockResolvedValue([])

    const { rerender } = renderHook(
      ({ wId }) => useLiveReadings('brazil', wId, 100000),
      { initialProps: { wId: 1 } }
    )

    await waitFor(() => expect(hqApi.getLatestReadings).toHaveBeenCalledWith('brazil', 1))

    rerender({ wId: 2 })

    await waitFor(() => expect(hqApi.getLatestReadings).toHaveBeenCalledWith('brazil', 2))
  })
})