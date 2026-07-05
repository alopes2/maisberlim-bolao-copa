import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const scoring = [
  ['Placar exato', '5'],
  ['Vencedor ou empate correto', '5'],
  ['Bônus por acertar placar exato e vencedor ou empate', '5'],
  ['Primeiro jogador a marcar', '3'],
  ['Artilheiro isolado de cada seleção', '3'],
  ['Um dos artilheiros empatados de cada seleção', '2'],
  ['Amarelos exatos de cada seleção', '1'],
  ['Vermelhos exatos de cada seleção', '1'],
]

export function RulesPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-4 p-4 sm:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Regras do bolão</CardTitle>
          <CardDescription>Critérios usados em cada jogo do Brasil.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 text-sm">
          <section className="flex flex-col gap-2">
            <h2 className="font-medium">Pontuação</h2>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
              {scoring.map(([label, points]) => (
                <div key={label} className="contents">
                  <dt>{label}</dt><dd>{points} pts</dd>
                </div>
              ))}
            </dl>
            <p className="text-muted-foreground">
              Os três critérios principais acumulam até 15 pontos. Nos jogos com pênaltis, o vencedor escolhido nos pênaltis conta como o vencedor. Placar exato com vencedor nos pênaltis incorreto ou ausente vale somente os 5 pontos do placar exato. As categorias secundárias somam no máximo 13 pontos. Em 0–0 não há pontos por primeiro gol ou artilheiro. O máximo é 28 pontos.
            </p>
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="font-medium">Prazo e desempate</h2>
            <p>Palpites e edições encerram 10 minutos antes do início. O relógio do servidor é a referência.</p>
            <ol className="list-decimal pl-5">
              <li>Maior total de pontos.</li>
              <li>Mais placares exatos.</li>
              <li>Mais acertos do primeiro jogador a marcar.</li>
              <li>Envio final mais antigo. Uma edição substitui o horário anterior.</li>
            </ol>
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="font-medium">Apuração e prêmios</h2>
            <p>
              A administração do MaisBerlim registra manualmente placar, gols, cartões e, quando houver, o ganhador nos pênaltis. O resultado confirmado pela administração é a decisão final para a pontuação.
            </p>
            <ul className="list-disc pl-5">
              <li>1º lugar — 5 caipirinhas</li>
              <li>2º lugar — 2 caipirinhas</li>
              <li>3º lugar — 1 caipirinha</li>
            </ul>
            <p>A identidade dos vencedores será validada antes da entrega dos prêmios.</p>
          </section>
        </CardContent>
      </Card>
    </main>
  )
}
