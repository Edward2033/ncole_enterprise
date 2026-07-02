import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import FloatingActionButtons from '@/components/FloatingActionButtons';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

const Layout: React.FC = () => {
  const site = useSiteSettings();
  const whatsapp = site.whatsappNumber ? site.whatsappNumber.replace(/\D/g, '') : '250794890144';

  return (
    <div className="flex min-h-screen flex-col bg-white overflow-x-hidden">
      <Header />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <FloatingActionButtons
        portal="PUBLIC"
        accentClass="bg-violet-600"
        greeting="Hi! I'm N-COLE, your shopping assistant. I can help you find products, answer questions, and more!"
        whatsappNumber={whatsapp}
        showWhatsApp
      />
    </div>
  );
};

export default Layout;
