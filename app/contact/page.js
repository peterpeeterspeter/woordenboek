export const metadata = {
  title: 'Contact',
  description: 'Neem contact op met Woordenboek.org — vragen, feedback of zakelijke verzoeken.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="page-content legal-page">
      <h1 className="legal-title">Contact</h1>
      <p>Vragen, feedback of zakelijke verzoeken?</p>

      <h2>Algemene vragen</h2>
      <p>E-mail: <a href="mailto:contact@woordenboek.org">contact@woordenboek.org</a></p>

      <h2>Over woordenboek.org</h2>
      <p>
        Woordenboek.org is een grootschalig Nederlands taalplatform gericht op definities,
        betekenissen en semantisch begrip van woorden. Het woordenboek bevat meer dan 400.000
        woorden en 162.000 definities uit het{' '}
        <a href="https://nl.wiktionary.org/" target="_blank" rel="noopener noreferrer">WikiWoordenboek</a>{' '}
        en de{' '}
        <a href="https://github.com/OpenTaal/opentaal-wordlist" target="_blank" rel="noopener noreferrer">OpenTaal woordenlijst</a>.
      </p>

      <h2>Reactietijd</h2>
      <p>Wij streven ernaar binnen 48 uur te reageren.</p>
    </div>
  );
}
