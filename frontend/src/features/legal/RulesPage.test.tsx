import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RulesPage } from './RulesPage'

function expectScore(label: string, points: number) {
  const term = screen.getByText(label)
  const row = term.parentElement

  expect(row).not.toBeNull()
  expect(within(row!).getByText(`${points} pts`)).toBeInTheDocument()
}

describe('RulesPage', () => {
  it('publishes the main scoring awards and how they accumulate', () => {
    render(<RulesPage />)

    expectScore('Placar exato', 5)
    expectScore('Vencedor ou empate correto', 5)
    expectScore('Bônus por acertar placar exato e vencedor ou empate', 5)
    expect(screen.getByText(/os três critérios principais acumulam até 15 pontos/i)).toBeInTheDocument()
  })

  it('explains penalty shootout scoring and the maximum score', () => {
    render(<RulesPage />)

    expect(screen.getByText(/nos jogos com pênaltis, o vencedor escolhido nos pênaltis conta como o vencedor/i)).toBeInTheDocument()
    expect(screen.getByText(/placar exato com vencedor nos pênaltis incorreto ou ausente vale somente os 5 pontos do placar exato/i)).toBeInTheDocument()
    expect(screen.getByText(/categorias secundárias somam no máximo 13 pontos/i)).toBeInTheDocument()
    expect(screen.getByText(/o máximo é 28 pontos/i)).toBeInTheDocument()
  })

  it('retains the secondary scoring categories', () => {
    render(<RulesPage />)

    expectScore('Primeiro jogador a marcar', 3)
    expectScore('Artilheiro isolado de cada seleção', 3)
    expectScore('Um dos artilheiros empatados de cada seleção', 2)
    expectScore('Amarelos exatos de cada seleção', 1)
    expectScore('Vermelhos exatos de cada seleção', 1)
    expect(screen.getByText(/em 0–0 não há pontos por primeiro gol ou artilheiro/i)).toBeInTheDocument()
  })
})
