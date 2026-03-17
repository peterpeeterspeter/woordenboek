export const metadata = {
  title: 'Algemene voorwaarden',
  description: 'Algemene voorwaarden van Woordenboek.org — gebruiksregels en aansprakelijkheid.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <div className="page-content legal-page">
      <h1 className="legal-title">Algemene voorwaarden</h1>
      <p className="legal-updated">Laatst bijgewerkt: maart 2026</p>
      <p>Door gebruik te maken van woordenboek.org gaat u akkoord met de volgende voorwaarden.</p>

      <h2>1. Gebruik van de website</h2>
      <p>Deze website biedt informatieve inhoud over Nederlandse woorden en taal.</p>
      <p>U stemt ermee in om:</p>
      <ul>
        <li>De site op een wettige manier te gebruiken</li>
        <li>De dienst niet te misbruiken of te verstoren</li>
      </ul>

      <h2>2. Disclaimer over inhoud</h2>
      <p>Alle inhoud wordt uitsluitend ter informatie aangeboden.</p>
      <p>Wij garanderen niet:</p>
      <ul>
        <li>Absolute nauwkeurigheid</li>
        <li>Volledigheid van definities</li>
      </ul>

      <h2>3. Intellectueel eigendom</h2>
      <p>Alle inhoud op deze site is eigendom van woordenboek.org, tenzij anders vermeld. Woorddefinities zijn afkomstig van <a href="https://nl.wiktionary.org/" target="_blank" rel="noopener noreferrer">WikiWoordenboek</a> (CC-BY-SA) en de <a href="https://github.com/OpenTaal/opentaal-wordlist" target="_blank" rel="noopener noreferrer">OpenTaal woordenlijst</a> (BSD/CC-BY).</p>
      <p>U mag niet:</p>
      <ul>
        <li>Inhoud kopiëren of herdistribueren zonder toestemming</li>
      </ul>

      <h2>4. Externe links</h2>
      <p>Wij kunnen linken naar websites van derden. Wij zijn niet verantwoordelijk voor hun inhoud of beleid.</p>

      <h2>5. Beperking van aansprakelijkheid</h2>
      <p>Wij zijn niet aansprakelijk voor:</p>
      <ul>
        <li>Schade als gevolg van het gebruik van de site</li>
        <li>Fouten of onvolledigheden in de inhoud</li>
      </ul>

      <h2>6. Wijzigingen</h2>
      <p>Wij kunnen deze voorwaarden op elk moment bijwerken.</p>

      <h2>7. Contact</h2>
      <p>E-mail: <a href="mailto:contact@woordenboek.org">contact@woordenboek.org</a></p>
    </div>
  );
}
