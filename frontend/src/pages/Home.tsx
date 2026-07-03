import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Truck, ShieldCheck, Sparkles, Star, Zap,
  Users, Package, MessageSquare,
} from 'lucide-react';
import Hero from '@/components/Hero';
import ProductGrid from '@/components/ProductGrid';
import { useProducts, useCollections } from '@/hooks/useProducts';
import { statsService, apiFetch } from '@/services/api';
import type { Banner } from '@/services/adminApi';

// ─── Why Choose Us data ───────────────────────────────────────────────────────
const WHY = [
  { icon: Truck, title: 'Free Delivery', text: 'Free delivery on every order across Rwanda' },
  { icon: ShieldCheck, title: 'Verified Vendors', text: 'Every vendor is screened and verified' },
  { icon: Zap, title: 'Fast Processing', text: 'Orders processed and dispatched same day' },
  { icon: Sparkles, title: 'AI-Powered', text: 'Smart recommendations by Gemini AI' },
  { icon: Users, title: '5,000+ Vendors', text: "Rwanda's largest vendor network" },
  { icon: Package, title: 'Easy Returns', text: 'Hassle-free returns within 7 days' },
];

interface Testimonial {
  id: string;
  name: string;
  role: string;
  rating: number;
  text: string;
  photoUrl?: string;
  isPublished: boolean;
}

const SectionHeader: React.FC<{ title: string; sub: string; link?: { to: string; label: string } }> = ({ title, sub, link }) => (
  <div className="mb-8 flex flex-col gap-2 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h2>
      <p className="mt-1 text-sm text-slate-500 sm:text-base">{sub}</p>
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
  const [stats, setStats] = useState({ vendors: 0, products: 0, customers: 0, orders: 0 });
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    statsService.get().then(r => setStats(r.data)).catch(() => null);
    apiFetch<{ success: boolean; data: Testimonial[] }>('/settings/testimonials/public')
      .then(r => setTestimonials((r.data ?? []).filter(t => t.isPublished)))
      .catch(() => null);
    apiFetch<{ success: boolean; data: Banner[] }>('/settings/banners/public')
      .then(r => setBanners(r.data ?? []))
      .catch(() => null);
  }, []);

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}K+` : n > 0 ? `${n}+` : '—';

  return (
    <div className="overflow-x-hidden">
      {/* ── Hero Slideshow ── */}
      <Hero />

      {/* ── Active Banners ── */}
      {banners.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {banners.map(b => (
              <div key={b.id} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-md">
                {b.imageUrl && (
                  <img src={b.imageUrl} alt={b.title} className="absolute inset-0 h-full w-full object-cover opacity-30" />
                )}
                <div className="relative p-5">
                  <h3 className="text-lg font-bold text-white">{b.title}</h3>
                  {b.description && <p className="mt-1 text-sm text-orange-100 line-clamp-2">{b.description}</p>}
                  {b.buttonText && b.linkUrl && (
                    <Link
                      to={b.linkUrl}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50 transition"
                    >
                      {b.buttonText} <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Trust bar ── */}
      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-0 divide-y divide-slate-100 px-4 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 lg:px-8">
          {[
            { icon: Truck, text: 'Free delivery on all orders' },
            { icon: ShieldCheck, text: 'Verified vendors only' },
            { icon: Zap, text: 'Same-day dispatch' },
            { icon: Sparkles, text: 'AI-powered shopping' },
          ].map(f => (
            <div key={f.text} className="flex items-center gap-3 px-4 py-3.5 sm:px-6 sm:py-5">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 sm:h-10 sm:w-10">
                <f.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <span className="text-sm font-medium text-slate-700">{f.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories Grid ── */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:py-16 lg:px-8">
        <SectionHeader title="Shop by Category" sub="Browse our curated collection of product categories" link={{ to: '/shop', label: 'All categories' }} />
        {collections.length === 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100 sm:h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {collections.slice(0, 12).map((c, i) => (
              <Link key={c.id} to={`/shop/category/${c.handle}`}
                style={{ animationDelay: `${i * 60}ms` }}
                className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg animate-fade-in sm:gap-3 sm:p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 text-orange-600 transition-transform duration-300 group-hover:scale-110 sm:h-12 sm:w-12">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="text-xs font-semibold text-slate-800 group-hover:text-orange-600 sm:text-sm line-clamp-2">{c.title}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Featured Products ── */}
      <section className="bg-slate-50 py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <SectionHeader title="Featured Products" sub="Hand-picked by our curation team" link={{ to: '/shop', label: 'View all' }} />
          <ProductGrid products={featured} loading={loading} />
        </div>
      </section>

      {/* ── AI Assistant Banner ── */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-16 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 p-6 sm:rounded-3xl sm:p-10 lg:p-14">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 left-1/2 h-48 w-48 rounded-full bg-orange-500/20" />
          <div className="relative grid gap-6 sm:gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white sm:px-4 sm:py-1.5">
                <Sparkles className="h-3 w-3" /> Powered by Google Gemini
              </span>
              <h2 className="mt-3 text-2xl font-bold text-white sm:mt-4 sm:text-3xl lg:text-4xl">Meet Ncole AI</h2>
              <p className="mt-2 text-sm text-violet-200 sm:mt-3 sm:text-base sm:max-w-lg">
                Ask anything — find products, track orders, get invoice explanations, and personalised recommendations. Available 24/7 on every page.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-violet-200 sm:mt-6 sm:gap-3 sm:text-sm">
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
                  <span className="text-sm font-semibold text-white">Ncole Assistant</span>
                  <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online</span>
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="rounded-xl rounded-bl-sm bg-white/15 px-3.5 py-2.5 text-white">What are today's best deals?</div>
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
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:pb-16 lg:px-8">
        <SectionHeader title="Trending Now" sub="Most popular products this week" link={{ to: '/shop', label: 'See all trending' }} />
        <ProductGrid products={trending} loading={loadingTrend} />
      </section>

      {/* ── Why Choose Us ── */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-16 lg:px-8">
        <div className="mb-8 text-center sm:mb-12">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Why Ncole Interpress?</h2>
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
      <section className="bg-orange-500 py-10 sm:py-12">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 text-center grid-cols-2 sm:grid-cols-4 sm:gap-8 lg:px-8">
          {[
            { label: 'Active Vendors', value: fmt(stats.vendors) },
            { label: 'Products Listed', value: fmt(stats.products) },
            { label: 'Happy Customers', value: fmt(stats.customers) },
            { label: 'Orders Completed', value: fmt(stats.orders) },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-white sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs font-medium text-orange-100 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials (DB-driven) ── */}
      {testimonials.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:py-16 lg:px-8">
          <div className="mb-8 text-center sm:mb-12">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">What Our Community Says</h2>
            <p className="mt-2 text-slate-500">Real stories from real people</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map(t => (
              <div key={t.id} className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                  ))}
                </div>
                <p className="mt-4 flex-1 text-slate-600 leading-relaxed">"{t.text}"</p>
                <div className="mt-5 flex items-center gap-3">
                  {t.photoUrl ? (
                    <img src={t.photoUrl} alt={t.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-400 text-sm font-bold text-white">
                      {t.name[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Stats / CTA bottom spacer so footer newsletter isn't doubled ── */}
      <div className="h-4" />
    </div>
  );
};

export default Home;
