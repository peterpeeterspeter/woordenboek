export const metadata = {
  title: 'Over dit woordenboek',
  description: 'Over Woordenboek.org — een gratis, open-source Nederlands woordenboek met meer dan 400.000 woorden.',
};

export default function AboutPage() {
  return (
    <div className="page-content word-page">
      <h1 className="word-heading" style={{ fontSize: 'var(--text-xl)' }}>
        Over Woordenboek.org
      </h1>

      <div className="word-info-card" style={{ marginBottom: 'var(--space-6)' }}>
        <p style={{ marginBottom: 'var(--space-4)' }}>
          Woordenboek.org is een gratis, open-source Nederlands woordenboek met meer dan{' '}
          <strong>400.000 woorden</strong> en <strong>162.000 verklaringen</strong>.
        </p>
        <p style={{ marginBottom: 'var(--space-4)' }}>
          De woordenlijst is afkomstig van de{' '}
          <a href="https://www.opentaal.org/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>
            OpenTaal stichting
          </a>
          . Definities, synoniemen, etymologie, uitdrukkingen en vertalingen komen uit het{' '}
          <a href="https://nl.wiktionary.org/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>
            WikiWoordenboek
          </a>{' '}
          (Nederlandse Wiktionary).
        </p>
        <p style={{ marginBottom: 'var(--space-4)' }}>
          <strong>Licentie:</strong> OpenTaal — BSD (software) en CC-BY (data). WikiWoordenboek — CC-BY-SA 3.0.
        </p>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>
        Statistieken
      </h2>
      <div className="word-info-card">
        <div className="word-info-row">
          <span className="word-info-label">Totaal woorden</span>
          <span className="word-info-value">408.704</span>
        </div>
        <div className="word-info-row">
          <span className="word-info-label">Woorden met verklaring</span>
          <span className="word-info-value">162.347</span>
        </div>
        <div className="word-info-row">
          <span className="word-info-label">Taal</span>
          <span className="word-info-value">Nederlands (NL, BE, SR)</span>
        </div>
        <div className="word-info-row">
          <span className="word-info-label">Bronnen</span>
          <span className="word-info-value">OpenTaal + WikiWoordenboek</span>
        </div>
      </div>
    </div>
  );
}
