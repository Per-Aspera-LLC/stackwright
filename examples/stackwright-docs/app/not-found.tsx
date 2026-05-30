import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <h1 style={{ fontSize: '3rem', margin: '0 0 1rem' }}>404</h1>
      <p style={{ fontSize: '1.25rem', margin: '0 0 2rem', color: '#666' }}>
        This page could not be found.
      </p>
      <Link
        href="/"
        style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          background: '#f59e0b',
          color: '#fff',
          borderRadius: '0.25rem',
          textDecoration: 'none',
        }}
      >
        Return Home
      </Link>
    </div>
  );
}
