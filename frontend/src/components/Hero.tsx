import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiFetch } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  buttonText?: string;
  buttonLink?: string;
  isActive: boolean;
  sortOrder: number;
}

// ─── Static fallback slides (shown while loading or when DB is empty) ─────────
const STATIC_SLIDES: HeroSlide[] = [
  {
    id: 'static-1',
    title: "Shop Premium Products from Trusted Vendors",
    subtitle: "Discover thousands of products across electronics, fashion, food, and more — delivered fast across Rwanda.",
    imageUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1400&q=80&auto=format&fit=crop',
    buttonText: 'Shop Now',
    buttonLink: '/shop',
    isActive: true,
    sortOrder: 0,
  },
  {
    id: 'static-2',
    title: "Grow Your Business on N_COLE Interpress",
    subtitle: "Join thousands of vendors already selling on Rwanda's fastest-growing e-commerce platform. Zero setup fees.",
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&q=80&auto=format&fit=crop',
    buttonText: 'Become a Vendor',
    buttonLink: '/shop',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'static-3',
    title: "Your Smart African Marketplace",
    subtitle: "Chat with N-COLE AI to find exactly what you need. Smart recommendations, real-time order tracking, instant support.",
    imageUrl: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=1400&q=80&auto=format&fit=crop',
    buttonText: 'Start Shopping',
    buttonLink: '/shop',
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'static-4',
    title: "Pay with MTN MoMo or Airtel Money",
    subtitle: "Built for Rwanda. Pay seamlessly with the payment methods you already trust. Fast, secure, local.",
    imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1400&q=80&auto=format&fit=crop',
    buttonText: 'Shop Now',
    buttonLink: '/shop',
    isActive: true,
    sortOrder: 3,
  },
];

const INTERVAL = 5000;

const Hero: React.FC = () => {
  const [slides, setSlides] = useState<HeroSlide[]>(STATIC_SLIDES);
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load live slides from settings API
  useEffect(() => {
    apiFetch<{ success: boolean; data: HeroSlide[] }>('/settings/hero-slides')
      .then(res => {
        const active = (res.data ?? []).filter(s => s.isActive);
        if (active.length > 0) setSlides(active);
      })
      .catch(() => null); // silently fall back to static slides
  }, []);

  const goTo = (idx: number) => {
    if (animating || slides.length <= 1) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent((idx + slides.length) % slides.length);
      setAnimating(false);
    }, 250);
  };

  // Auto-advance
  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % slides.length);
    }, INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [slides.length]);

  const slide = slides[current] ?? slides[0];
  if (!slide) return null;

  return (
    <section className="relative h-[92vh] min-h-[560px] max-h-[780px] overflow-hidden bg-slate-900">
      {/* Background image */}
      <div
        key={slide.id}
        className={`absolute inset-0 transition-opacity duration-700 ${animating ? 'opacity-0' : 'opacity-100'}`}
      >
        <img src={slide.imageUrl} alt="" className="h-full w-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-transparent" />
      </div>

      {/* Content */}
      <div className={`relative flex h-full flex-col justify-center transition-all duration-500 ${animating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="mt-2 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">{slide.subtitle}</p>
            )}
            <div className="mt-8 flex flex-wrap gap-4">
              {slide.buttonText && slide.buttonLink && (
                <Link
                  to={slide.buttonLink}
                  className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 active:scale-95"
                >
                  {slide.buttonText} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 active:scale-95"
              >
                Browse Products
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-300">
              {['Free delivery on all orders', 'MTN MoMo & Airtel Money', 'Verified vendors only'].map(t => (
                <span key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${i === current ? 'w-8 h-2 bg-orange-500' : 'w-2 h-2 bg-white/40 hover:bg-white/70'}`}
            />
          ))}
        </div>
      )}

      {/* Arrow controls */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => goTo(current - 1)}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 lg:left-8"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => goTo(current + 1)}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 lg:right-8"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-8 right-8 text-xs font-semibold text-white/50">
            {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </div>
        </>
      )}
    </section>
  );
};

export default Hero;
