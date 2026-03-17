import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="page-content" style={{ textAlign: 'center', paddingTop: 'var(--space-12)' }}>
      <h1 className="word-heading" style={{ fontSize: 'var(--text-xl)' }}>
        Woord niet gevonden
      </h1>
      <p style={{ color: 'var(--color-text-faint)', marginBottom: 'var(--space-6)' }}>
        Dit woord bestaat niet in ons woordenboek.
      </p>
      <Link href="/" style={{ color: 'var(--color-primary)' }}>
        ← Terug naar de startpagina
      </Link>
    </div>
  );
}
