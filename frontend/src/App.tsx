import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, Route, Routes, useSearchParams } from 'react-router-dom'

import type { ApiClient } from '@/api/client'
import { useAuth } from '@/auth/auth-context'
import { ProfilePage } from '@/auth/ProfilePage'
import { SignInPage } from '@/auth/SignInPage'
import { Button } from '@/components/ui/button'
import { CurrentMatchPage } from '@/features/match/CurrentMatchPage'
import { PrivacyPage } from '@/features/legal/PrivacyPage'
import { RulesPage } from '@/features/legal/RulesPage'
import { AdminMatchPage } from '@/features/admin/AdminMatchPage'
import { AdminMatchesPage } from '@/features/admin/AdminMatchesPage'

function NotFoundPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-lg font-semibold">Página não encontrada.</h1>
      <Button variant="outline" asChild>
        <Link to="/">Voltar ao início</Link>
      </Button>
    </main>
  )
}

function AuthenticatedApp({ api, isAdmin }: { api: ApiClient, isAdmin: boolean }) {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [profileCompleted, setProfileCompleted] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const profileQuery = useQuery({
    queryKey: ['profile-status'],
    queryFn: () => api.hasProfile(),
    enabled: auth.status === 'authenticated' && !isAdmin,
  })

  if (auth.status === 'checking') {
    return (
      <main className="flex min-h-svh items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">Verificando sessão…</p>
      </main>
    )
  }

  if (auth.status === 'unauthenticated') {
    return <SignInPage auth={auth.client} onAuthenticated={auth.refresh} />
  }

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await auth.signOut()
    } finally {
      setSigningOut(false)
    }
  }

  let page
  if (isAdmin) {
    const matchId = searchParams.get('matchId')
    page = matchId
      ? <AdminMatchPage api={api} matchId={matchId} />
      : <AdminMatchesPage api={api} />
  } else if (profileQuery.isPending && !profileCompleted) {
    page = <main className="p-4 text-sm text-muted-foreground">Verificando perfil…</main>
  } else {
    page = profileCompleted || profileQuery.data ? (
      <CurrentMatchPage api={api} />
    ) : (
      <ProfilePage api={api} onCompleted={() => {
        setProfileCompleted(true)
        queryClient.setQueryData(['profile-status'], true)
      }} />
    )
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4 sm:px-8">
          <span className="font-semibold">Bolão MaisBerlim</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/regras">Regras</Link>
            </Button>
            <Button variant="outline" onClick={handleSignOut} disabled={signingOut}>
              Sair
            </Button>
          </div>
        </div>
      </header>
      {page}
    </>
  )
}

export function App({ api }: { api: ApiClient }) {
  return (
    <Routes>
      <Route path="/" element={<AuthenticatedApp api={api} isAdmin={false} />} />
      <Route path="/admin" element={<AuthenticatedApp api={api} isAdmin />} />
      <Route path="/regras" element={<RulesPage />} />
      <Route path="/datenschutz" element={<PrivacyPage />} />
      <Route path="/privacidade" element={<PrivacyPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
