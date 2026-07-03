import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PrivacyPage } from './PrivacyPage'

describe('PrivacyPage', () => {
  it('presents the current privacy notice in Portuguese and German', () => {
    render(<PrivacyPage />)

    const portuguese = screen.getByRole('region', { name: 'Privacidade' })
    const german = screen.getByRole('region', { name: 'Datenschutzerklärung' })
    const portugueseContent = within(portuguese)
    const germanContent = within(german)

    expect(portuguese).toHaveAttribute('lang', 'pt-BR')
    expect(german).toHaveAttribute('lang', 'de')

    for (const section of [portuguese, german]) {
      const content = within(section)
      expect(content.getByText(/Andre Lopes/)).toBeInTheDocument()
      expect(content.getByText(/Augusto Medeiros/)).toBeInTheDocument()
      expect(content.getByText(/Dernburgstr 23A, 14057 Berlin/)).toBeInTheDocument()
      expect(content.getByRole('link', { name: 'maisberlim@gmail.com' })).toHaveAttribute('href', 'mailto:maisberlim@gmail.com')
      expect(content.getByRole('link', { name: 'andrevitorlopes@gmail.com' })).toHaveAttribute('href', 'mailto:andrevitorlopes@gmail.com')
      expect(content.getAllByText(/Google/).length).toBeGreaterThan(0)
      expect(content.getAllByText(/AWS/).length).toBeGreaterThan(0)
      expect(content.getByText(/Art\. 6\(1\)\(b\)/)).toBeInTheDocument()
      expect(content.getByText(/Art\. 6\(1\)\(f\)/)).toBeInTheDocument()
      expect(content.getByText(/Art\. 22/)).toBeInTheDocument()
    }

    expect(portugueseContent.getByText(/e-mail verificado/i)).toBeInTheDocument()
    expect(portugueseContent.getByText(/identificadores do Google e do Cognito.*perfil\/nome.*nome público derivado.*palpites, pontuações e horários relevantes.*pessoa participante.*login com Google/i)).toBeInTheDocument()
    expect(portugueseContent.getByText(/sem os dados obrigatórios de identidade e dos palpites, não é possível operar a participação/i)).toBeInTheDocument()
    expect(portugueseContent.getByText(/autenticação.*uma participação por pessoa.*administração da competição.*apuração de pontos e classificação.*contato\/validação de vencedores/i)).toBeInTheDocument()
    expect(portugueseContent.getByText(/integridade da competição.*prevenir abuso.*operação segura.*interesses legítimos.*prevenção de fraude e abuso.*segurança do serviço/i)).toBeInTheDocument()
    expect(portugueseContent.getByText(/AWS.*Cognito\/autenticação.*hospedagem.*API.*DynamoDB\/banco de dados.*logs.*opcionalmente, e-mail ao vencedor/i)).toBeInTheDocument()
    expect(portugueseContent.getByText(/serviços regionais de backend e armazenamento.*configurados.*eu-central-1/i)).toBeInTheDocument()
    expect(portugueseContent.getByText(/conteúdo do cliente armazenado ou processado por serviços regionais.*fora da região selecionada.*fornecer ou manter serviços iniciados.*lei ou ordem válida e vinculante/i)).toBeInTheDocument()
    expect(portugueseContent.getByText(/CloudFront.*frontend.*rede global de edge.*dados técnicos de requisição.*endereço IP.*metadados da requisição.*dados relacionados a logs.*edge locations fora do Espaço Econômico Europeu/i)).toBeInTheDocument()
    expect(portugueseContent.getByText(/cláusulas contratuais padrão.*Decisão 2021\/914.*automaticamente/i)).toBeInTheDocument()
    expect(portugueseContent.getByRole('link', { name: /adendo de processamento de dados da AWS/i })).toHaveAttribute('href', 'https://docs.aws.amazon.com/whitepapers/latest/navigating-gdpr-compliance/aws-data-processing-addendum-dpa.html')
    expect(portugueseContent.queryByText(/recursos da aplicação na AWS usam a região selecionada eu-central-1/i)).not.toBeInTheDocument()
    expect(portugueseContent.getByText(/Google pode processar informações da conta e do login.*servidores fora do país de residência/i)).toBeInTheDocument()
    expect(portugueseContent.getByText(/Google LLC participa do EU-US Data Privacy Framework.*mecanismos de adequação aplicáveis/i)).toBeInTheDocument()
    expect(portugueseContent.getByRole('link', { name: /estruturas de transferência do Google/i })).toHaveAttribute('href', 'https://policies.google.com/privacy/frameworks?hl=pt-BR')
    expect(portugueseContent.getByText(/nome público abreviado.*palpites.*encerramento.*pontuações.*classificação.*vencedores.*nome completo e e-mail não são públicos/i)).toBeInTheDocument()
    expect(portugueseContent.getByText(/90 dias.*resultados agregados e anônimos da competição podem permanecer/i)).toBeInTheDocument()
    expect(portugueseContent.getByText(/avaliação automática determinística.*resultados confirmados pela administração.*não é uma decisão automatizada com efeitos jurídicos ou efeitos igualmente significativos.*Art\. 22/i)).toBeInTheDocument()
    expect(portugueseContent.getByText(/acesso, correção, exclusão, limitação, oposição e portabilidade/i)).toBeInTheDocument()
    expect(portugueseContent.getByText(/reclamar à autoridade de proteção de dados competente/i)).toBeInTheDocument()
    expect(portugueseContent.getByText(/não usa publicidade nem ferramentas de análise/i)).toBeInTheDocument()

    expect(germanContent.getByText(/verifizierte E-Mail-Adresse/i)).toBeInTheDocument()
    expect(germanContent.getByText(/Google- und Cognito-Kennungen.*Profil- und Namensdaten.*abgeleiteten öffentlichen Namen.*Tipps, Punkte und relevante Zeitstempel.*von den Teilnehmenden.*Anmeldung mit Google/i)).toBeInTheDocument()
    expect(germanContent.getByText(/ohne die erforderlichen Identitäts- und Tippdaten ist eine Teilnahme nicht möglich/i)).toBeInTheDocument()
    expect(germanContent.getByText(/Authentifizierung.*eine Teilnahme pro Person.*Verwaltung des Wettbewerbs.*Punkteberechnung und Rangfolge.*Kontaktaufnahme und Prüfung von Gewinnern/i)).toBeInTheDocument()
    expect(germanContent.getByText(/Integrität des Wettbewerbs.*Missbrauchsprävention.*sicheren Betrieb.*berechtigten Interessen.*Verhinderung von Betrug und Missbrauch.*Sicherheit des Dienstes/i)).toBeInTheDocument()
    expect(germanContent.getByText(/AWS.*Cognito\/Authentifizierung.*Hosting.*API.*DynamoDB\/Datenbank.*Protokolle.*optional eine E-Mail an Gewinner/i)).toBeInTheDocument()
    expect(germanContent.getByText(/regionalen Backend- und Speicherdienste.*eu-central-1 konfiguriert/i)).toBeInTheDocument()
    expect(germanContent.getByText(/Kundeninhalte, die von regionalen Diensten gespeichert oder verarbeitet werden.*aus der ausgewählten Region verlagert.*initiierte Dienste bereitzustellen oder zu warten.*Gesetz oder eine gültige verbindliche Anordnung/i)).toBeInTheDocument()
    expect(germanContent.getByText(/CloudFront.*Frontend.*globales Edge-Netzwerk.*technische Anfragedaten.*IP-Adresse.*Anfragemetadaten.*protokollbezogene Daten.*Edge-Standorten außerhalb des Europäischen Wirtschaftsraums/i)).toBeInTheDocument()
    expect(germanContent.getByText(/Standardvertragsklauseln.*Beschluss 2021\/914.*automatisch/i)).toBeInTheDocument()
    expect(germanContent.getByRole('link', { name: /AWS-Auftragsverarbeitungsvereinbarung/i })).toHaveAttribute('href', 'https://docs.aws.amazon.com/whitepapers/latest/navigating-gdpr-compliance/aws-data-processing-addendum-dpa.html')
    expect(germanContent.queryByText(/AWS-Ressourcen der App nutzen die ausgewählte Region eu-central-1/i)).not.toBeInTheDocument()
    expect(germanContent.getByText(/Google kann Konto- und Anmeldeinformationen.*Servern außerhalb des Wohnsitzlandes verarbeiten/i)).toBeInTheDocument()
    expect(germanContent.getByText(/Google LLC am EU-US Data Privacy Framework teilnimmt.*anwendbare Angemessenheitsmechanismen/i)).toBeInTheDocument()
    expect(germanContent.getByRole('link', { name: /Google-Rahmenbedingungen für Datenübermittlungen/i })).toHaveAttribute('href', 'https://policies.google.com/privacy/frameworks?hl=de')
    expect(germanContent.getByText(/gekürzter öffentlicher Name.*Tipps.*Abgabeschluss.*Punkte.*Ranglisten.*Rundensieger.*vollständiger Name und E-Mail-Adresse sind nicht öffentlich/i)).toBeInTheDocument()
    expect(germanContent.getByText(/90 Tage.*anonyme, zusammengefasste Wettbewerbsergebnisse können erhalten bleiben/i)).toBeInTheDocument()
    expect(germanContent.getByText(/deterministische automatische Auswertung.*von der Administration bestätigten Ergebnissen.*keine automatisierte Entscheidung mit rechtlicher oder ähnlich erheblicher Wirkung.*Art\. 22/i)).toBeInTheDocument()
    expect(germanContent.getByText(/Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch und Datenübertragbarkeit/i)).toBeInTheDocument()
    expect(germanContent.getByText(/zuständigen Datenschutzaufsichtsbehörde beschweren/i)).toBeInTheDocument()
    expect(germanContent.getByText(/keine Werbung und keine Analysewerkzeuge/i)).toBeInTheDocument()

    expect(screen.getAllByRole('link', { name: 'maisberlim@gmail.com' })).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: 'andrevitorlopes@gmail.com' })).toHaveLength(2)
  })
})
