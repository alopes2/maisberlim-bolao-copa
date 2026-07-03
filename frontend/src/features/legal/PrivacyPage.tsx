import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'

const linkClassName = 'underline underline-offset-2'

export function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-4 p-4 sm:p-8">
      <section lang="pt-BR" aria-labelledby="privacy-pt-title">
        <Card>
          <CardHeader>
            <h1 id="privacy-pt-title" className="font-heading text-base leading-snug font-medium">Privacidade</h1>
            <CardDescription>Como o bolão MaisBerlim trata dados pessoais atualmente.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 text-sm">
            <section className="flex flex-col gap-2">
              <h2 className="font-medium">Responsáveis e contato</h2>
              <p>
                Andre Lopes e Augusto Medeiros são conjuntamente responsáveis pelo tratamento. Endereço: Dernburgstr 23A, 14057 Berlin. Contato:{' '}
                <a className={linkClassName} href="mailto:maisberlim@gmail.com">maisberlim@gmail.com</a> ou{' '}
                <a className={linkClassName} href="mailto:andrevitorlopes@gmail.com">andrevitorlopes@gmail.com</a>.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="font-medium">Dados e origem</h2>
              <p>
                Tratamos e-mail verificado; identificadores do Google e do Cognito e dados de perfil/nome; nome e nome público derivado; palpites, pontuações e horários relevantes. Os dados vêm da pessoa participante e do login com Google.
              </p>
              <p>Sem os dados obrigatórios de identidade e dos palpites, não é possível operar a participação.</p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="font-medium">Finalidades e bases legais</h2>
              <p>
                Usamos os dados para autenticação, uma participação por pessoa, administração da competição, apuração de pontos e classificação e contato/validação de vencedores, com base no Art. 6(1)(b) do GDPR, para realizar a participação e operar a competição.
              </p>
              <p>
                Para preservar a integridade da competição, prevenir abuso e manter a operação segura, usamos o Art. 6(1)(f) do GDPR. Nossos interesses legítimos são uma competição íntegra, a prevenção de fraude e abuso e a segurança do serviço.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="font-medium">Prestadores e destinatários</h2>
              <p>
                Usamos Google para autenticação e AWS para Cognito/autenticação, hospedagem, API, DynamoDB/banco de dados, logs e, opcionalmente, e-mail ao vencedor.
              </p>
              <p>
                Os serviços regionais de backend e armazenamento estão configurados na região eu-central-1. A AWS informa que o conteúdo do cliente armazenado ou processado por serviços regionais não é transferido para fora da região selecionada, exceto quando necessário para fornecer ou manter serviços iniciados pelo cliente ou para cumprir a lei ou ordem válida e vinculante.
              </p>
              <p>
                O CloudFront distribui o frontend por uma rede global de edge. Dados técnicos de requisição, como endereço IP, metadados da requisição e dados relacionados a logs, podem ser processados em edge locations fora do Espaço Econômico Europeu.
              </p>
              <p>
                Para transferências a países terceiros sem decisão de adequação, o adendo de processamento de dados da AWS incorpora as cláusulas contratuais padrão da Comissão Europeia (Decisão 2021/914) automaticamente, quando aplicáveis. Detalhes e cópias estão disponíveis no{' '}
                <a className={linkClassName} href="https://docs.aws.amazon.com/whitepapers/latest/navigating-gdpr-compliance/aws-data-processing-addendum-dpa.html">adendo de processamento de dados da AWS</a>.
              </p>
              <p>
                O Google pode processar informações da conta e do login em servidores fora do país de residência. O Google informa que a Google LLC participa do EU-US Data Privacy Framework e se baseia nos mecanismos de adequação aplicáveis. Detalhes e cópias estão disponíveis nas{' '}
                <a className={linkClassName} href="https://policies.google.com/privacy/frameworks?hl=pt-BR">estruturas de transferência do Google</a>.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="font-medium">Visibilidade pública</h2>
              <p>
                Ficam públicos o nome público abreviado, os palpites depois do encerramento do envio, as pontuações, a classificação e os vencedores de cada rodada. Nome completo e e-mail não são públicos.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="font-medium">Prazo de conservação</h2>
              <p>
                Excluímos ou anonimizamos os dados pessoais 90 dias depois da última entrega de prêmio relevante. Resultados agregados e anônimos da competição podem permanecer.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="font-medium">Pontuação automática</h2>
              <p>
                A avaliação automática determinística calcula os pontos a partir dos resultados confirmados pela administração. Ela não é uma decisão automatizada com efeitos jurídicos ou efeitos igualmente significativos nos termos do Art. 22 do GDPR.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="font-medium">Seus direitos</h2>
              <p>
                Conforme aplicável, você pode pedir acesso, correção, exclusão, limitação, oposição e portabilidade dos dados por qualquer um dos e-mails acima. Você também pode reclamar à autoridade de proteção de dados competente.
              </p>
            </section>

            <p className="text-muted-foreground">
              Este aviso descreve o aplicativo atual, que não usa publicidade nem ferramentas de análise.
            </p>
          </CardContent>
        </Card>
      </section>

      <section lang="de" aria-labelledby="privacy-de-title">
        <Card>
          <CardHeader>
            <h1 id="privacy-de-title" className="font-heading text-base leading-snug font-medium">Datenschutzerklärung</h1>
            <CardDescription>Wie das MaisBerlim-Tippspiel derzeit personenbezogene Daten verarbeitet.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 text-sm">
            <section className="flex flex-col gap-2">
              <h2 className="font-medium">Gemeinsam Verantwortliche und Kontakt</h2>
              <p>
                Andre Lopes und Augusto Medeiros sind gemeinsam für die Verarbeitung verantwortlich. Anschrift: Dernburgstr 23A, 14057 Berlin. Kontakt:{' '}
                <a className={linkClassName} href="mailto:maisberlim@gmail.com">maisberlim@gmail.com</a> oder{' '}
                <a className={linkClassName} href="mailto:andrevitorlopes@gmail.com">andrevitorlopes@gmail.com</a>.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="font-medium">Daten und Herkunft</h2>
              <p>
                Wir verarbeiten die verifizierte E-Mail-Adresse; Google- und Cognito-Kennungen sowie Profil- und Namensdaten; den Namen und den daraus abgeleiteten öffentlichen Namen; Tipps, Punkte und relevante Zeitstempel. Die Daten erhalten wir von den Teilnehmenden und über die Anmeldung mit Google.
              </p>
              <p>Ohne die erforderlichen Identitäts- und Tippdaten ist eine Teilnahme nicht möglich.</p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="font-medium">Zwecke und Rechtsgrundlagen</h2>
              <p>
                Wir verwenden die Daten zur Authentifizierung, zur Begrenzung auf eine Teilnahme pro Person, zur Verwaltung des Wettbewerbs, zur Punkteberechnung und Rangfolge sowie zur Kontaktaufnahme und Prüfung von Gewinnern. Rechtsgrundlage ist Art. 6(1)(b) DSGVO für die Durchführung der Teilnahme und des Wettbewerbs.
              </p>
              <p>
                Für die Integrität des Wettbewerbs, die Missbrauchsprävention und den sicheren Betrieb gilt Art. 6(1)(f) DSGVO. Unsere berechtigten Interessen sind ein fairer Wettbewerb, die Verhinderung von Betrug und Missbrauch sowie die Sicherheit des Dienstes.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="font-medium">Dienstleister und Empfänger</h2>
              <p>
                Wir nutzen Google zur Authentifizierung und AWS für Cognito/Authentifizierung, Hosting, API, DynamoDB/Datenbank, Protokolle und optional eine E-Mail an Gewinner.
              </p>
              <p>
                Die regionalen Backend- und Speicherdienste sind in eu-central-1 konfiguriert. AWS erklärt, dass Kundeninhalte, die von regionalen Diensten gespeichert oder verarbeitet werden, nicht aus der ausgewählten Region verlagert werden, außer soweit dies erforderlich ist, um vom Kunden initiierte Dienste bereitzustellen oder zu warten oder ein Gesetz oder eine gültige verbindliche Anordnung zu erfüllen.
              </p>
              <p>
                CloudFront verteilt das Frontend über ein globales Edge-Netzwerk. Technische Anfragedaten wie IP-Adresse, Anfragemetadaten und protokollbezogene Daten können an Edge-Standorten außerhalb des Europäischen Wirtschaftsraums verarbeitet werden.
              </p>
              <p>
                Für Übermittlungen in Drittländer ohne Angemessenheitsbeschluss nimmt die AWS-Auftragsverarbeitungsvereinbarung die Standardvertragsklauseln der Europäischen Kommission (Beschluss 2021/914) automatisch auf, soweit sie anwendbar sind. Einzelheiten und Kopien sind in der{' '}
                <a className={linkClassName} href="https://docs.aws.amazon.com/whitepapers/latest/navigating-gdpr-compliance/aws-data-processing-addendum-dpa.html">AWS-Auftragsverarbeitungsvereinbarung</a> verfügbar.
              </p>
              <p>
                Google kann Konto- und Anmeldeinformationen auf Servern außerhalb des Wohnsitzlandes verarbeiten. Google erklärt, dass Google LLC am EU-US Data Privacy Framework teilnimmt und sich auf anwendbare Angemessenheitsmechanismen stützt. Einzelheiten und Kopien sind in den{' '}
                <a className={linkClassName} href="https://policies.google.com/privacy/frameworks?hl=de">Google-Rahmenbedingungen für Datenübermittlungen</a> verfügbar.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="font-medium">Öffentliche Sichtbarkeit</h2>
              <p>
                Öffentlich sichtbar sind ein gekürzter öffentlicher Name, die Tipps nach dem Abgabeschluss, Punkte, Ranglisten und Rundensieger. Vollständiger Name und E-Mail-Adresse sind nicht öffentlich.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="font-medium">Speicherdauer</h2>
              <p>
                Wir löschen oder anonymisieren personenbezogene Daten 90 Tage nach der letzten relevanten Preisübergabe. Anonyme, zusammengefasste Wettbewerbsergebnisse können erhalten bleiben.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="font-medium">Automatische Punkteberechnung</h2>
              <p>
                Die deterministische automatische Auswertung berechnet Punkte aus den von der Administration bestätigten Ergebnissen. Sie ist keine automatisierte Entscheidung mit rechtlicher oder ähnlich erheblicher Wirkung im Sinne von Art. 22 DSGVO.
              </p>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="font-medium">Ihre Rechte</h2>
              <p>
                Soweit anwendbar, können Sie Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch und Datenübertragbarkeit über jede der oben genannten E-Mail-Adressen verlangen. Sie können sich außerdem bei der zuständigen Datenschutzaufsichtsbehörde beschweren.
              </p>
            </section>

            <p className="text-muted-foreground">
              Dieser Hinweis beschreibt die aktuelle App. Sie verwendet keine Werbung und keine Analysewerkzeuge.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
