import { describe, it, expect } from 'vitest'
import {
  COUNTRY_CONDITIONS,
  TEMP_TOLERANCE,
  HUMIDITY_TOLERANCE,
  EXPIRY_DAYS,
  LOT_STATUS,
  ALERT_TYPE,
  getConditions,
  daysInStorage,
} from '../api/constants'

describe('Constantes métier (CDC)', () => {

  describe('Conditions idéales par pays', () => {
    it('Brésil : 29°C / 55%', () => {
      expect(COUNTRY_CONDITIONS.BR.idealTemp).toBe(29)
      expect(COUNTRY_CONDITIONS.BR.idealHumidity).toBe(55)
    })

    it('Équateur : 31°C / 60%', () => {
      expect(COUNTRY_CONDITIONS.EC.idealTemp).toBe(31)
      expect(COUNTRY_CONDITIONS.EC.idealHumidity).toBe(60)
    })

    it('Colombie : 26°C / 80%', () => {
      expect(COUNTRY_CONDITIONS.CO.idealTemp).toBe(26)
      expect(COUNTRY_CONDITIONS.CO.idealHumidity).toBe(80)
    })
  })

  describe('Tolérances (CDC §III.2)', () => {
    it('Tolérance température : ±3°C', () => {
      expect(TEMP_TOLERANCE).toBe(3)
    })

    it('Tolérance humidité : ±2%', () => {
      expect(HUMIDITY_TOLERANCE).toBe(2)
    })
  })

  describe('Seuil de péremption FIFO', () => {
    it('Seuil à 365 jours', () => {
      expect(EXPIRY_DAYS).toBe(365)
    })
  })

  describe('getConditions()', () => {
    it('retourne les conditions Brésil pour le code BR', () => {
      const cond = getConditions('BR')
      expect(cond.idealTemp).toBe(29)
      expect(cond.idealHumidity).toBe(55)
    })

    it('retourne les conditions Colombie par défaut si code inconnu', () => {
      const cond = getConditions('XX')
      expect(cond).toEqual(COUNTRY_CONDITIONS.CO)
    })
  })

  describe('daysInStorage()', () => {
    it('calcule correctement le nombre de jours depuis une date passée', () => {
      const dateIlYA10Jours = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      const days = daysInStorage(dateIlYA10Jours)
      expect(days).toBeGreaterThanOrEqual(9)
      expect(days).toBeLessThanOrEqual(11)
    })

    it('retourne 0 pour une date du jour', () => {
      const aujourd_hui = new Date().toISOString()
      const days = daysInStorage(aujourd_hui)
      expect(days).toBe(0)
    })
  })

  describe('LOT_STATUS', () => {
    it('contient les 3 statuts attendus', () => {
      expect(LOT_STATUS).toHaveProperty('compliant')
      expect(LOT_STATUS).toHaveProperty('alert')
      expect(LOT_STATUS).toHaveProperty('expired')
    })
  })

  describe('ALERT_TYPE', () => {
    it('contient les 3 types d\'alerte attendus', () => {
      expect(ALERT_TYPE).toHaveProperty('temperature')
      expect(ALERT_TYPE).toHaveProperty('humidity')
      expect(ALERT_TYPE).toHaveProperty('expiration')
    })
  })
})