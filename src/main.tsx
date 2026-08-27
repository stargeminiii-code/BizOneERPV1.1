import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './i18n';
import './index.css';

// Central API routing for the static frontend.
// Production: https://wiup.vn -> https://api.wiup.vn -> Render backend.
// Local/dev: keep relative /api paths unless VITE_API_BASE_URL is explicitly set.
const configuredApiBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
const productionApiBase =
  typeof window !== 'undefined' && window.location.hostname.endsWith('wiup.vn')
    ? 'https://api.wiup.vn'
    : '';
const API_BASE_URL = configuredApiBase || productionApiBase;

if (typeof window !== 'undefined' && API_BASE_URL) {
  const nativeFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let requestInput: RequestInfo | URL = input;

    try {
      const rawUrl = input instanceof Request ? input.url : String(input);
      const isApiPath = rawUrl.startsWith('/api/') || rawUrl.startsWith('/api?');
      const isSameOriginApi =
        typeof window !== 'undefined' &&
        rawUrl.startsWith(window.location.origin + '/api/');

      if (isApiPath) {
        requestInput = `${API_BASE_URL}${rawUrl}`;
      } else if (isSameOriginApi) {
        requestInput = `${API_BASE_URL}${new URL(rawUrl).pathname}${new URL(rawUrl).search}`;
      }
    } catch {
      // Preserve native fetch behavior for non-standard RequestInfo values.
      requestInput = input;
    }

    return nativeFetch(requestInput, init);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
