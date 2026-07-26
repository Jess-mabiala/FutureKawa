import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AlertPanel from '../components/AlertPanel'

const makeAlert = (overrides = {}) => ({
  id: 1,
  country: 'brazil',
  type: 'temperature',
  details: 'Valeur hors plage — Température: 35°C',
  triggeredAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // il y a 30 min
  warehouseName: 'Entrepôt BR-1',
  lotCode: null,
  emailSent: false,
  ...overrides,
})

describe('AlertPanel', () => {

  describe('État vide', () => {
    it('affiche le message "Tout est conforme" quand aucune alerte', () => {
      render(<AlertPanel alerts={[]} onResolve={vi.fn()} />)
      expect(screen.getByText('Tout est conforme')).toBeInTheDocument()
    })

    it('affiche le badge avec 0', () => {
      render(<AlertPanel alerts={[]} onResolve={vi.fn()} />)
      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })

  describe('Affichage des alertes', () => {
    it('affiche les détails de l\'alerte', () => {
      render(<AlertPanel alerts={[makeAlert()]} onResolve={vi.fn()} />)
      expect(screen.getByText(/Valeur hors plage/)).toBeInTheDocument()
    })

    it('affiche le nom de l\'entrepôt', () => {
      render(<AlertPanel alerts={[makeAlert()]} onResolve={vi.fn()} />)
      expect(screen.getByText('Entrepôt BR-1')).toBeInTheDocument()
    })

    it('affiche le badge avec le bon nombre d\'alertes', () => {
      const alerts = [makeAlert({ id: 1 }), makeAlert({ id: 2 })]
      render(<AlertPanel alerts={alerts} onResolve={vi.fn()} />)
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  describe('Résolution d\'alerte', () => {
    it('appelle onResolve avec l\'id et le pays corrects', () => {
      const onResolve = vi.fn()
      render(<AlertPanel alerts={[makeAlert({ id: 42, country: 'ecuador' })]} onResolve={onResolve} />)

      fireEvent.click(screen.getByText('Marquer résolue'))

      expect(onResolve).toHaveBeenCalledWith(42, 'ecuador')
    })
  })

  describe('Test de régression — clés dupliquées (bug multi-pays)', () => {
    it('affiche correctement deux alertes avec le même id mais pays différents', () => {
      const alerts = [
        makeAlert({ id: 266, country: 'brazil', details: 'Alerte Brésil' }),
        makeAlert({ id: 266, country: 'ecuador', details: 'Alerte Équateur' }),
      ]
      render(<AlertPanel alerts={alerts} onResolve={vi.fn()} />)

      expect(screen.getByText('Alerte Brésil')).toBeInTheDocument()
      expect(screen.getByText('Alerte Équateur')).toBeInTheDocument()
    })

    it('appelle onResolve avec le bon pays lors de la résolution', () => {
      const onResolve = vi.fn()
      const alerts = [
        makeAlert({ id: 266, country: 'brazil', details: 'Alerte Brésil' }),
        makeAlert({ id: 266, country: 'ecuador', details: 'Alerte Équateur' }),
      ]
      render(<AlertPanel alerts={alerts} onResolve={onResolve} />)

      const buttons = screen.getAllByText('Marquer résolue')
      fireEvent.click(buttons[1]) // deuxième bouton = Équateur

      expect(onResolve).toHaveBeenCalledWith(266, 'ecuador')
      expect(onResolve).not.toHaveBeenCalledWith(266, 'brazil')
    })
  })

  describe('Email envoyé', () => {
    it('affiche "Email envoyé" quand emailSent est true', () => {
      render(<AlertPanel alerts={[makeAlert({ emailSent: true })]} onResolve={vi.fn()} />)
      expect(screen.getByText(/Email envoyé/)).toBeInTheDocument()
    })

    it('affiche "Email en attente" quand emailSent est false', () => {
      render(<AlertPanel alerts={[makeAlert({ emailSent: false })]} onResolve={vi.fn()} />)
      expect(screen.getByText('Email en attente')).toBeInTheDocument()
    })
  })
})
