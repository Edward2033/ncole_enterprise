import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Truck, ShieldCheck, Sparkles, Star, Zap,
  Users, Package, TrendingUp, MessageSquare, Send,
} from 'lucide-react';
import Hero from '@/components/Hero';
import ProductGrid from '@/components/ProductGrid';
import { useProducts, useCollections } from '@/hooks/useProducts';
import { statsService } from '@/services/api';

// ─── Why Choose Us data ───────────────────────────────────────────────────────
const WHY = [
  { icon: Truck, title: 'Free Delivery', text: 'Free delivery on every order across Rwanda' },
  { icon: ShieldCheck, title: 'Verified Vendors', text: 'Every vendor is screened and verified' },
  { icon: Zap, title: 'Fast Processing', text: 'Orders processed and dispatched same day' },
  { icon: Sparkles, title: 'AI-Powered', text: 'Smart recommendations by Gemini AI' },
  { icon: Users, title: '5,000+ Vendors', text: 'Rwanda\'s largest vendor network' },
  { icon: Package, title: 'Easy Returns', text: 'Hassle-free returns within 7 days' },
];

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'Amina Uwase', role: 'Business Owner, Kigali', rating: 5, text: 'N_COLE has transformed how I source supplies. Everything arrives on time and vendors are very professional.' },
  { name: 'Jean-Pierre Habimana', role: 'Student, Butare', rating: 5, text: 'The AI assistant helped me find exactly what I needed in seconds. Incredible shopping experience!' },
  { name: 'Grace Mukamana', role: 'Vendor, Musanze', rating: 5, text: 'As a vendor my sales tripled in 3 months. The dashboard and analytics are world class.' },
];

// ─── Vendor Spotlight (static placeholder — hidden until real vendor API is available)
const VENDORS: never[] = [];

const SectionHeader: React.FC<{ title: string; sub: string; link?: { to: string; label: string } }> = ({ title, sub, link }) => (
  <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-slate-500">{sub}</p>
    </div>
    {link && (
      <Link to={link.to} className="flex items-center gap-1 text-sm font-semibold text-orange-600 hover:gap-2 transition-all">
        {link.label} <ArrowRight className="h-4 w-4" />
      </Link>
    )}
  </div>
);

const Home: React.FC = () => {
  const { products: featured, loading } = useProducts({ tag: 'featured' });
  const { products: trending, loading: loadingTrend } = useProducts({ tag: 'bestseller' });
  const collections = useCollections();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [stats, setStats] = useState({ vendors: 0, products: 0, customers: 0, orders: 0 });

  useEffect(() => {
    statsService.get().then(r => setStats(r.data)).catch(() => null);
  }, []);

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}K+` : n > 0 ? `${n}+` : '—';

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) { setSubscribed(true); setEmail(''); }
  };

  return (
    <div className="overflow-x-hidden">
      {/* ── Hero Slideshow ── */}
      <Hero />

      {/* ── Trust bar ── */}
      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-0 divide-y divide-slate-100 px-4 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 lg:px-8">
          {[
            { icon: Truck, text: 'Free delivery on all orders' },
            { icon: ShieldCheck, text: 'Verified vendors only' },
            { icon: Zap, text: 'Same-day dispatch' },
            { icon: Sparkles, text: 'AI-powered shopping' },
          ].map(f => (
            <div key={f.text} className="flex items-center gap-3 px-6 py-5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <f.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-slate-700">{f.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories Grid ── */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <SectionHeader title="Shop by Category" sub="Browse our curated collection of product categories" link={{ to: '/shop', label: 'All categories' }} />
        {collections.length === 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {collections.slice(0, 12).map((c, i) => (
              <Link key={c.id} to={`/shop/category/${c.handle}`}
                style={{ animationDelay: `${i * 60}ms` }}
                className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg animate-fade-in">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 text-orange-600 transition-transform duration-300 group-hover:scale-110">
                  <Package className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold text-slate-800 group-hover:text-orange-600">{c.title}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Featured Products ── */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <SectionHeader title="Featured Products" sub="Hand-picked by our curation team" link={{ to: '/shop', label: 'View all' }} />
          <ProductGrid products={featured} loading={loading} />
        </div>
      </section>

      {/* ── AI Assistant Banner ── */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 p-10 lg:p-14">
          {/* decorative circles */}
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 left-1/2 h-48 w-48 rounded-full bg-orange-500/20" />
          <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white">
                <Sparkles className="h-3 w-3" /> Powered by Google Gemini
              </span>
              <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Meet N-COLE AI</h2>
              <p className="mt-3 max-w-lg text-violet-200">
                Ask anything — find products, track orders, get invoice explanations, and personalised recommendations. Available 24/7 on every page.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-violet-200">
                {['Product discovery', 'Order tracking', 'Invoice help', 'Smart recommendations'].map(tag => (
                  <span key={tag} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="hidden lg:flex justify-end">
              <div className="w-72 rounded-2xl bg-white/10 p-4 backdrop-blur-sm ring-1 ring-white/20">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">N</div>
                  <span className="text-sm font-semibold text-white">N-COLE Assistant</span>
                  <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online</span>
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="rounded-xl rounded-bl-sm bg-white/15 px-3.5 py-2.5 text-white">What are today\'s best deals?</div>
                  <div className="ml-4 rounded-xl rounded-br-sm bg-orange-500 px-3.5 py-2.5 text-white">Here are 5 top deals across Electronics and Fashion just for you...</div>
                  <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-violet-200 text-xs">
                    <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" /> Ask me anything about orders, products, or your account
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trending Products ── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
        <SectionHeader title="Trending Now" sub="Most popular products this week" link={{ to: '/shop', label: 'See all trending' }} />
        <ProductGrid products={trending} loading={loadingTrend} />
      </section>

      {/* ── Vendor Spotlight ── */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">Top Vendors</h2>
              <p className="mt-1 text-slate-400">Trusted by thousands of buyers every month</p>
            </div>
            <Link to="/shop" className="flex items-center gap-1 text-sm font-semibold text-orange-400 hover:gap-2 transition-all">
              All vendors <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VENDORS.map(v => (
              <div key={v.name}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-orange-500/40 hover:bg-white/10">
                <span className="absolute right-4 top-4 rounded-full bg-orange-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-400">{v.badge}</span>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-2xl font-bold text-white">
                  {v.name[0]}
                </div>
                <h3 className="mt-4 font-bold text-white group-hover:text-orange-300 transition-colors">{v.name}</h3>
                <p className="text-sm text-slate-400">{v.category}</p>
                <div className="mt-4 flex items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1"><Package className="h-4 w-4" /> {v.products} products</span>
                  <span className="flex items-center gap-1"><Star className="h-4 w-4 text-amber-400 fill-amber-400" /> {v.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900">Why N_COLE Interpress?</h2>
          <p className="mt-2 text-slate-500">Built for Rwanda, designed for Africa</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {WHY.map(w => (
            <div key={w.title} className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <w.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{w.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{w.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats banner ── */}
      <section className="bg-orange-500 py-12">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 text-center sm:grid-cols-4 lg:px-8">
          {[
            { label: 'Active Vendors', value: fmt(stats.vendors) },
            { label: 'Products Listed', value: fmt(stats.products) },
            { label: 'Happy Customers', value: fmt(stats.customers) },
            { label: 'Orders Completed', value: fmt(stats.orders) },
          ].map(s => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-white">{s.value}</p>
              <p className="mt-1 text-sm font-medium text-orange-100">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900">What Our Community Says</h2>
          <p className="mt-2 text-slate-500">Real stories from real people</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex gap-1 text-amber-400">
                {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400" />)}
              </div>
              <p className="mt-4 flex-1 text-slate-600 leading-relaxed">"{t.text}"</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-400 text-sm font-bold text-white">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="bg-slate-900 py-16">
        <div className="mx-auto max-w-2xl px-4 text-center lg:px-8">
          <TrendingUp className="mx-auto h-10 w-10 text-orange-400" />
          <h2 className="mt-4 text-3xl font-bold text-white">Stay Ahead of the Market</h2>
          <p className="mt-3 text-slate-400">Get exclusive deals, new vendor alerts, and weekly picks delivered to your inbox.</p>
          {subscribed ? (
            <div className="mt-8 rounded-2xl bg-emerald-500/20 py-5 text-emerald-400 font-semibold">
              ✓ You're subscribed! Welcome to N_COLE Interpress.
            </div>
          ) : (
            <form onSubmit={handleNewsletter} className="mt-8 flex gap-3 flex-col sm:flex-row">
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 rounded-full bg-white/10 px-5 py-3.5 text-sm text-white outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500"
              />
              <button type="submit" className="flex items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3.5 text-sm font-semibold text-white hover:bg-orange-600 transition whitespace-nowrap">
                <Send className="h-4 w-4" /> Subscribe Free
              </button>
            </form>
          )}
          <p className="mt-3 text-xs text-slate-500">No spam. Unsubscribe at any time.</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
