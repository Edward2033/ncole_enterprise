import { useState, useEffect } from 'react';
import { adminSettingsApi } from '@/services/adminApi';

// Module-level cache — fetched once, shared across all layouts
let cachedLogo = '';
let cachedFavicon = '';
let fetched = false;
const listeners: Array<(logo: string, favicon: string) => void> = [];

function notify(logo: string, favicon: string) {
  listeners.forEach(fn => fn(logo, favicon));
}

function fetchOnce() {
  if (fetched) return;
  fetched = true;
  adminSettingsApi.getHeaderSettingsPublic()
    .then(r => {
      cachedLogo = r.data?.logoUrl ?? '';
      cachedFavicon = r.data?.faviconUrl ?? '';
      if (cachedFavicon) {
        const link =
          document.querySelector<HTMLLinkElement>('link[rel~="icon"]') ??
          Object.assign(document.createElement('link'), { rel: 'icon' });
        link.href = cachedFavicon;
        document.head.appendChild(link);
      }
      notify(cachedLogo, cachedFavicon);
    })
    .catch(() => { fetched = false; }); // allow retry on error
}

export function useSiteLogo() {
  const [logoUrl, setLogoUrl] = useState(cachedLogo);
  const [loaded, setLoaded] = useState(fetched);

  useEffect(() => {
    const handler = (logo: string) => {
      setLogoUrl(logo);
      setLoaded(true);
    };
    listeners.push(handler);
    fetchOnce();
    // If already fetched before this component mounted
    if (fetched && cachedLogo !== logoUrl) {
      setLogoUrl(cachedLogo);
      setLoaded(true);
    }
    return () => {
      const i = listeners.indexOf(handler);
      if (i !== -1) listeners.splice(i, 1);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { logoUrl, loaded };
}
