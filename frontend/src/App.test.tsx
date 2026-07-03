import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ApiClient } from '@/api/client'
import { AuthContext, type AuthContextValue } from '@/auth/auth-context'

import { App } from './App'

function renderAuthenticatedApp(
  signOut: AuthContextValue['signOut'],
  api: ApiClient = {} as ApiClient,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const auth: AuthContextValue = {
    client: {
      signIn: vi.fn(),
      signOut: vi.fn(),
      accessToken: vi.fn().mockResolvedValue('token'),
    },
    status: 'authenticated',
    refresh: vi.fn(),
    signOut,
  }

  render(
    <AuthContext.Provider value={auth}>
      <QueryClientProvider client={queryClient}>
        <App api={api} />
      </QueryClientProvider>
    </AuthContext.Provider>,
  )
}

function renderUnauthenticatedApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const auth: AuthContextValue = {
    client: {
      signIn: vi.fn(),
      signOut: vi.fn(),
      accessToken: vi.fn().mockResolvedValue(null),
    },
    status: 'unauthenticated',
    refresh: vi.fn(),
    signOut: vi.fn(),
  }

  render(
    <AuthContext.Provider value={auth}>
      <QueryClientProvider client={queryClient}>
        <App api={{} as ApiClient} />
      </QueryClientProvider>
    </AuthContext.Provider>,
  )
}

describe('App', () => {
  afterEach(() => window.history.replaceState({}, '', '/'))

  it('shows the authenticated header and signs out', async () => {
    const user = userEvent.setup()
    const signOut = vi.fn().mockResolvedValue(undefined)
    window.history.replaceState({}, '', '/admin')

    renderAuthenticatedApp(signOut)

    expect(screen.getByText('Bolão MaisBerlim')).toBeVisible()
    const rulesLink = screen.getByRole('link', { name: 'Regras' })
    const signOutButton = screen.getByRole('button', { name: 'Sair' })
    expect(rulesLink).toHaveAttribute('href', '/regras')
    expect(rulesLink.compareDocumentPosition(signOutButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await user.click(signOutButton)
    expect(signOut).toHaveBeenCalledOnce()
  })

  it.each(['/datenschutz', '/privacidade'])('shows privacy publicly at %s', (path) => {
    window.history.replaceState({}, '', path)

    renderUnauthenticatedApp()

    expect(screen.getByText('Privacidade')).toBeVisible()
    expect(screen.queryByRole('button', { name: /entrar com google/i })).toBeNull()
  })

  it('shows match management on the admin landing route', async () => {
    window.history.replaceState({}, '', '/admin')
    const api = {
      getAdminMatches: vi.fn().mockResolvedValue({
        matches: [],
      }),
      getAdminTeams: vi.fn().mockResolvedValue([]),
    } as unknown as ApiClient

    renderAuthenticatedApp(vi.fn(), api)

    expect(await screen.findByText('Adicionar jogo manualmente')).toBeVisible()
  })

  it('keeps the result page for an admin match ID', async () => {
    window.history.replaceState({}, '', '/admin?matchId=wc2026-123')
    const api = {
      getAdminMatches: vi.fn().mockResolvedValue({
        matches: [{
          id: 'wc2026-123', kickoff: '2026-06-29T17:00:00Z',
          homeTeamFifaCode: 'BRA', awayTeamFifaCode: 'GER',
          status: 'Active', resultConfirmed: false,
        }],
      }),
      getAdminResult: vi.fn().mockResolvedValue({
        goals: [], homeYellowCards: 0, awayYellowCards: 0,
        homeRedCards: 0, awayRedCards: 0, penaltyWinnerTeamFifaCode: null,
      }),
      getProvisionalLeaderboard: vi.fn().mockResolvedValue({ entries: [], roundWinner: null }),
      saveAdminResult: vi.fn(),
      confirmResult: vi.fn(),
    } as unknown as ApiClient

    renderAuthenticatedApp(vi.fn(), api)

    expect(await screen.findByText('Apuração do jogo')).toBeVisible()
    expect(api.getAdminResult).toHaveBeenCalledWith('wc2026-123')
    expect(api.getProvisionalLeaderboard).toHaveBeenCalledWith('wc2026-123')
  })
})
