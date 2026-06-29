import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';

const Layout: React.FC = () => (
  <div className="flex min-h-screen flex-col bg-white">
    <Header />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
    <CartDrawer />
  </div>
);

export default Layout;
