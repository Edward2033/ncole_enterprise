import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Something went wrong</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '400px', marginBottom: '1.5rem' }}>
            The app encountered an unexpected error. Make sure the backend is running on{' '}
            <code style={{ background: '#f1f5f9', padding: '0 4px', borderRadius: '4px' }}>
              {import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1'}
            </code>
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: '9999px', padding: '0.65rem 1.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
