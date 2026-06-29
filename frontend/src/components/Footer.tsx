import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Mail, Phone, MapPin, Send, ArrowRight } from 'lucide-react';
import { useCollections } from '@/hooks/useProducts';

const Footer: React.FC = () => {
  const collections = useCollections();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) { setDone(true); setEmail(''); }
  };

  return (
    <footer className="mt-20 bg-slate-900 text-slate-300">
      {/* Newsletter */}
      <div className="border-b border-slate-800">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-2 lg:px-8">
          <div>
            <h3 className="text-2xl font-bold text-white">Get the best deals first</h3>
            <p className="mt-2 text-sm text-slate-400">Join 50,000+ subscribers. New deals every week.</p>
          </div>
          {done ? (
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">✓ You're subscribed!</div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-3">
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 rounded-full bg-slate-800 px-5 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-orange-500" />
              <button type="submit" className="flex items-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition whitespace-nowrap">
                <Send className="h-4 w-4" /> Subscribe
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Links grid */}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <span className="font-bold text-white text-lg">N_COLE Interpress</span>
          </Link>
          <p className="mt-4 text-sm text-slate-400 leading-relaxed">
            Rwanda's premier multi-vendor e-commerce marketplace. Powered by AI. Built for Africa.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-white">Shop</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/shop" className="hover:text-orange-400 transition-colors flex items-center gap-1"><ArrowRight className="h-3 w-3" /> All Products</Link></li>
            {collections.slice(0, 5).map(c => (
              <li key={c.id}><Link to={`/shop/category/${c.handle}`} className="hover:text-orange-400 transition-colors flex items-center gap-1"><ArrowRight className="h-3 w-3" />{c.title}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-white">Platform</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/login" className="hover:text-orange-400 transition-colors">Become a Vendor</Link></li>
            <li><Link to="/login" className="hover:text-orange-400 transition-colors">Customer Portal</Link></li>
            <li><a href="#" className="hover:text-orange-400 transition-colors">Help Center</a></li>
            <li><a href="#" className="hover:text-orange-400 transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-orange-400 transition-colors">Careers</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-white">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-orange-400 flex-shrink-0" /> hello@ncoleinterpress.com</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-orange-400 flex-shrink-0" /> +250 788 000 000</li>
            <li className="flex items-start gap-2"><MapPin className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" /> KG 8 Ave, Kigali, Rwanda</li>
          </ul>
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Payments accepted</p>
            <div className="flex gap-2 text-xs">
              <span className="rounded-lg bg-yellow-500/20 px-2.5 py-1 font-semibold text-yellow-400">MTN MoMo</span>
              <span className="rounded-lg bg-red-500/20 px-2.5 py-1 font-semibold text-red-400">Airtel Money</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} N_COLE Interpress. All rights reserved. · Built for Rwanda 🇷🇼
      </div>
    </footer>
  );
};

export default Footer;
