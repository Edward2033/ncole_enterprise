import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Mail, Phone, MapPin, Send, ArrowRight, Github, Linkedin, Facebook, Twitter } from 'lucide-react';
import { useCollections } from '@/hooks/useProducts';
import { API_BASE } from '@/config/api';
import type { SiteSettings } from '@/services/adminApi';

const Footer: React.FC = () => {
  const collections = useCollections();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [site, setSite] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/settings/site`)
      .then(r => r.json())
      .then(j => { if (j?.data) setSite(j.data); })
      .catch(() => null);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) { setDone(true); setEmail(''); }
  };

  const siteName    = site?.siteName    || 'N_COLE Interpress';
  const footerText  = site?.footerText  || "Rwanda's premier multi-vendor e-commerce marketplace. Powered by AI. Built for Africa.";
  const contactEmail = site?.contactEmail || null;
  const phone       = site?.phoneNumber  || null;
  const address     = site?.address      || null;
  const whatsapp    = site?.whatsappNumber ? site.whatsappNumber.replace(/\D/g, '') : null;

  return (
    <footer className="mt-10 bg-slate-900 text-slate-300 sm:mt-20" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
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
            <form onSubmit={handleSubscribe} className="flex flex-col gap-3 sm:flex-row">
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 rounded-full bg-slate-800 px-5 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-orange-500" />
              <button type="submit" className="flex items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition whitespace-nowrap">
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
            <span className="font-bold text-white text-lg">{siteName}</span>
          </Link>
          <p className="mt-4 text-sm text-slate-400 leading-relaxed">{footerText}</p>

          {/* Social links */}
          <div className="mt-5 flex gap-3">
            {site?.githubUrl   && <a href={site.githubUrl}   target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition"><Github   className="h-5 w-5" /></a>}
            {site?.linkedinUrl && <a href={site.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition"><Linkedin  className="h-5 w-5" /></a>}
            {site?.facebookUrl && <a href={site.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition"><Facebook  className="h-5 w-5" /></a>}
            {site?.twitterUrl  && <a href={site.twitterUrl}  target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition"><Twitter   className="h-5 w-5" /></a>}
          </div>
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
            <li><Link to="/login"  className="hover:text-orange-400 transition-colors">Become a Vendor</Link></li>
            <li><Link to="/login"  className="hover:text-orange-400 transition-colors">Customer Portal</Link></li>
            <li><a href="#"        className="hover:text-orange-400 transition-colors">Help Center</a></li>
            <li><a href="#"        className="hover:text-orange-400 transition-colors">About Us</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-white">Contact</h4>
          <ul className="space-y-3 text-sm">
            {contactEmail && (
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-orange-400 flex-shrink-0" />
                <a href={`mailto:${contactEmail}`} className="hover:text-orange-400 transition-colors">{contactEmail}</a>
              </li>
            )}
            {phone && (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-orange-400 flex-shrink-0" />
                <a href={`tel:${phone}`} className="hover:text-orange-400 transition-colors">{phone}</a>
              </li>
            )}
            {whatsapp && (
              <li className="flex items-center gap-2">
                <svg viewBox="0 0 32 32" className="h-4 w-4 fill-green-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 2C8.268 2 2 8.268 2 16c0 2.49.648 4.83 1.782 6.86L2 30l7.338-1.742A13.93 13.93 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm6.34 19.94c-.348-.174-2.06-1.016-2.38-1.132-.318-.116-.55-.174-.78.174-.232.348-.896 1.132-1.098 1.364-.202.232-.404.26-.752.086-.348-.174-1.47-.542-2.8-1.726-1.034-.922-1.732-2.06-1.936-2.408-.202-.348-.022-.536.152-.71.156-.154.348-.404.522-.606.174-.202.232-.348.348-.58.116-.232.058-.434-.028-.608-.088-.174-.78-1.882-1.07-2.578-.282-.676-.568-.584-.78-.594l-.664-.012c-.232 0-.608.086-.926.434-.318.348-1.214 1.186-1.214 2.892s1.242 3.354 1.416 3.586c.174.232 2.444 3.732 5.922 5.234.828.358 1.474.572 1.978.732.832.264 1.588.226 2.186.138.666-.1 2.06-.842 2.35-1.656.29-.814.29-1.512.202-1.656-.086-.144-.318-.232-.666-.406z" />
                </svg>
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors">WhatsApp</a>
              </li>
            )}
            {address && (
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" /> {address}
              </li>
            )}
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
        © {new Date().getFullYear()} {siteName}. All rights reserved. · Built for Rwanda 🇷🇼
      </div>
    </footer>
  );
};

export default Footer;
