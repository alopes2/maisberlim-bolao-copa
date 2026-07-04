import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { describe, expect, it, vi } from 'vitest'

import type { ApiClient } from '@/api/client'
import { CurrentMatchPage } from './CurrentMatchPage'

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }))
vi.mock('./PredictionForm', () => ({
  PredictionForm: ({ onSubmit }: { onSubmit: (prediction: object) => Promise<void> }) => (
    <button type="button" onClick={() => void onSubmit({ homeGoals: 1, awayGoals: 0 })}>
      Salvar palpite
    </button>
  ),
}))

describe('CurrentMatchPage', () => {
  it('shows the empty state without loading match-dependent data when no match is active', async () => {
    const api = {
      getCurrentMatch: vi.fn().mockResolvedValue(null),
      getLeaderboard: vi.fn().mockResolvedValue({ entries: [], roundWinner: null }),
      getMatchHistory: vi.fn().mockResolvedValue([]),
      getPublicPredictions: vi.fn(),
      getUserPrediction: vi.fn(),
    } as unknown as ApiClient
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <CurrentMatchPage api={api} />
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Nenhum bolao ativo no momento')).toBeVisible()
    expect(api.getLeaderboard).not.toHaveBeenCalled()
    expect(api.getMatchHistory).toHaveBeenCalledOnce()
    expect(api.getPublicPredictions).not.toHaveBeenCalled()
    expect(api.getUserPrediction).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: /salvar palpite/i })).toBeNull()
    expect(screen.getByRole('link', { name: 'Datenschutz' })).toHaveAttribute('href', '/datenschutz')
  })

  it('shows a success toast after saving a prediction', async () => {
    const user = userEvent.setup()
    const api = {
      getCurrentMatch: vi.fn().mockResolvedValue({
        id: 'match-1', kickoff: '2026-07-05T18:00:00Z',
        homeTeamFifaCode: 'BRA', awayTeamFifaCode: 'ARG',
      }),
      getLeaderboard: vi.fn().mockResolvedValue({ entries: [], roundWinner: null }),
      getMatchHistory: vi.fn().mockResolvedValue([]),
      getPublicPredictions: vi.fn().mockRejectedValue(new Error('not available')),
      getUserPrediction: vi.fn().mockResolvedValue(null),
      savePrediction: vi.fn().mockResolvedValue({ submittedAt: '2026-07-04T13:00:00Z' }),
    } as unknown as ApiClient
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <CurrentMatchPage api={api} />
      </QueryClientProvider>,
    )

    await user.click(await screen.findByRole('button', { name: 'Salvar palpite' }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Palpite salvo.'))
  })

  it('loads the leaderboard for the current match', async () => {
    const api = {
      getCurrentMatch: vi.fn().mockResolvedValue({
        id: 'bra-gha-03-07', kickoff: '2026-07-05T18:00:00Z',
        homeTeamFifaCode: 'BRA', awayTeamFifaCode: 'GHA',
      }),
      getLeaderboard: vi.fn().mockResolvedValue({ entries: [], roundWinner: null }),
      getMatchHistory: vi.fn().mockResolvedValue([]),
      getPublicPredictions: vi.fn().mockRejectedValue(new Error('not available')),
      getUserPrediction: vi.fn().mockResolvedValue(null),
    } as unknown as ApiClient
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <CurrentMatchPage api={api} />
      </QueryClientProvider>,
    )

    await waitFor(() => expect(api.getLeaderboard).toHaveBeenCalledWith('bra-gha-03-07'))
  })
})
