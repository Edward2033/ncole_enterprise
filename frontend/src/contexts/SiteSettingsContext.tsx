import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE } from '@/config/api';
import type { SiteSettings } from '@/services/adminApi';

const DEFAULTS: SiteSettings = {
  siteName:       'N_COLE Interpress',
  supportEmail:   'support@ncoleinterpress.com',
  contactEmail:   'hello@ncoleinterpress.com',
  whatsappNumber: '+250794890144',
  phoneNumber:    '+250794890144',
  githubUrl:      'https://github.com/Edward2033',
  linkedinUrl:    '',
  facebookUrl:    'https://facebook.com/edwardycole',
  twitterUrl:     '',
  footerText:     "Rwanda's premier multi-vendor e-commerce marketplace. Powered by AI. Built for Africa.",
  address:        'KG 8 Ave, Kigali, Rwanda',
};

const SiteSettingsContext = createContext<SiteSettings>(DEFAULTS);

export const useSiteSettings = () => useContext(SiteSettingsContext);

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);

  useEffect(() => {
    fetch(`${API_BASE}/settings/site`)
      .then(r => r.json())
      .then(j => { if (j?.data) setSettings(j.data); })
      .catch(() => null);
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
};
