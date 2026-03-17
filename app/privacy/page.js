export const metadata = {
  title: 'Privacybeleid',
  description: 'Privacybeleid van Woordenboek.org — hoe wij omgaan met uw gegevens en privacy.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="page-content legal-page">
      <h1 className="legal-title">Privacybeleid</h1>
      <p className="legal-updated">Laatst bijgewerkt: maart 2026</p>
      <p>Woordenboek.org respecteert uw privacy en zet zich in voor de bescherming van uw persoonsgegevens.</p>

      <h2>1. Gegevens die wij verzamelen</h2>
      <p>Wij kunnen de volgende gegevens verzamelen:</p>
      <ul>
        <li>Anonieme gebruiksgegevens (bezochte pagina's, tijd op de site)</li>
        <li>Apparaat- en browserinformatie</li>
        <li>IP-adres (waar mogelijk geanonimiseerd)</li>
      </ul>
      <p>Wij verzamelen geen persoonlijk identificeerbare informatie, tenzij u rechtstreeks contact met ons opneemt.</p>

      <h2>2. Hoe wij gegevens gebruiken</h2>
      <p>Wij gebruiken gegevens om:</p>
      <ul>
        <li>De prestaties en inhoud van de website te verbeteren</li>
        <li>Verkeer te analyseren via Google Analytics</li>
        <li>Relevante advertenties te tonen via Google AdSense</li>
      </ul>

      <h2>3. Cookies en tracking</h2>
      <p>Wij gebruiken cookies om:</p>
      <ul>
        <li>Gebruikersvoorkeuren op te slaan</li>
        <li>Verkeer en gebruik te meten</li>
        <li>Gepersonaliseerde of niet-gepersonaliseerde advertenties te tonen</li>
      </ul>
      <p>U kunt cookies accepteren of weigeren via onze cookiebanner.</p>

      <h2>4. Diensten van derden</h2>
      <p>Wij maken gebruik van:</p>
      <ul>
        <li><strong>Google Analytics</strong> — verkeersanalyse</li>
        <li><strong>Google AdSense</strong> — advertenties</li>
      </ul>
      <p>Deze diensten kunnen gegevens verwerken volgens hun eigen privacybeleid.</p>

      <h2>5. Rechten inzake gegevensbescherming (AVG/GDPR)</h2>
      <p>Als EU-gebruiker heeft u het recht om:</p>
      <ul>
        <li>Toegang te krijgen tot uw gegevens</li>
        <li>Verwijdering van uw gegevens te verzoeken</li>
        <li>Uw toestemming op elk moment in te trekken</li>
      </ul>

      <h2>6. Contact</h2>
      <p>Voor privacygerelateerde vragen:</p>
      <p>E-mail: <a href="mailto:contact@woordenboek.org">contact@woordenboek.org</a></p>
    </div>
  );
}
