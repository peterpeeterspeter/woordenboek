export const metadata = {
  title: 'Cookiebeleid',
  description: 'Cookiebeleid van Woordenboek.org — welke cookies wij gebruiken en hoe u deze kunt beheren.',
  alternates: { canonical: '/cookies' },
};

export default function CookiesPage() {
  return (
    <div className="page-content legal-page">
      <h1 className="legal-title">Cookiebeleid</h1>
      <p className="legal-updated">Laatst bijgewerkt: maart 2026</p>
      <p>Deze website maakt gebruik van cookies om uw ervaring te verbeteren.</p>

      <h2>1. Wat zijn cookies?</h2>
      <p>Cookies zijn kleine tekstbestanden die op uw apparaat worden opgeslagen.</p>

      <h2>2. Soorten cookies die wij gebruiken</h2>

      <h3>Essentiële cookies</h3>
      <p>Vereist voor de basisfunctionaliteit van de website.</p>

      <h3>Analytische cookies</h3>
      <p>Meten het websitegebruik via Google Analytics.</p>

      <h3>Advertentiecookies</h3>
      <p>Gebruikt door Google AdSense om advertenties weer te geven.</p>

      <h2>3. Toestemming</h2>
      <p>Wanneer u onze site bezoekt, kunt u:</p>
      <ul>
        <li>Cookies accepteren</li>
        <li>Niet-essentiële cookies weigeren</li>
      </ul>
      <p>Uw keuze wordt opgeslagen en kan op elk moment worden gewijzigd.</p>

      <h2>4. Cookies beheren</h2>
      <p>U kunt cookies ook beheren via uw browserinstellingen.</p>

      <h2>5. Cookies van derden</h2>
      <p>Google en partners kunnen cookies gebruiken voor:</p>
      <ul>
        <li>Gepersonaliseerde advertenties</li>
        <li>Metingen</li>
      </ul>
      <p>
        Zie:{' '}
        <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
          Google Ads-beleid
        </a>
      </p>

      <h2>6. Contact</h2>
      <p>E-mail: <a href="mailto:contact@woordenboek.org">contact@woordenboek.org</a></p>
    </div>
  );
}
