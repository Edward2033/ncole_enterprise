import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiFetch } from '@/services/api';

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

const STATIC_SLIDES: HeroSlide[] = [
  {
    id: 's1',
    title: 'Shop Premium Products from Trusted Vendors',
    subtitle: 'Discover thousands of products across electronics, fashion, food, and more — delivered fast across Rwanda.',
    imageUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1400&q=80&auto=format&fit=crop',
    buttonText: 'Shop Now',
    buttonLink: '/shop',
    isActive: true,
    sortOrder: 0,
  },
  {
    id: 's2',
    title: 'Grow Your Business on Ncole Interpress',
    subtitle: "Join thousands of vendors already selling on Rwanda's fastest-growing e-commerce platform. Zero setup fees.",
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&q=80&auto=format&fit=crop',
    buttonText: 'Become a Vendor',
    buttonLink: '/apply',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 's3',
    title: 'Your Smart African Marketplace',
    subtitle: 'Chat with Ncole AI to find exactly what you need. Smart recommendations, real-time order tracking, instant support.',
    imageUrl: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=1400&q=80&auto=format&fit=crop',
    buttonText: 'Start Shopping',
    buttonLink: '/shop',
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 's4',
    title: 'Pay with MTN MoMo or Airtel Money',
    subtitle: 'Built for Rwanda. Pay seamlessly with the payment methods you already trust. Fast, secure, local.',
    imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1400&q=80&auto=format&fit=crop',
    buttonText: 'Shop Now',
    buttonLink: '/shop',
    isActive: true,
    sortOrder: 3,
  },
];

const INTERVAL = 5500;

const Hero: React.FC = () => {
  const [slides, setSlides] = useState<HeroSlide[]>(STATIC_SLIDES);
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [direction, setDirection] = useState<'left' | 'right'>('left');
  const [sliding, setSliding] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    apiFetch<{ success: boolean; data: HeroSlide[] }>('/settings/hero-slides/public')
      .then(res => {
        const active = (res.data ?? []).filter(s => s.isActive);
        if (active.length > 0) setSlides(active);
      })
      .catch(() => null);
  }, []);

  const startProgress = useCallback(() => {
    setProgress(0);
    if (progressRef.current) clearInterval(progressRef.current);
    const step = 100 / (INTERVAL / 50);
    progressRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(progressRef.current!); return 100; }
        return p + step;
      });
    }, 50);
  }, []);

  const goTo = useCallback((idx: number, dir: 'left' | 'right' = 'left') => {
    if (sliding || slides.length <= 1) return;
    setDirection(dir);
    setSliding(true);
    setPrev(current);
    setTimeout(() => {
      setCurrent((idx + slides.length) % slides.length);
      setSliding(false);
      setPrev(null);
      startProgress();
    }, 500);
  }, [sliding, slides.length, current, startProgress]);

  const next = useCallback(() => goTo(current + 1, 'left'), [current, goTo]);
  const back = useCallback(() => goTo(current - 1, 'right'), [current, goTo]);

  // Auto-advance
  useEffect(() => {
    if (slides.length <= 1) return;
    startProgress();
    timerRef.current = setInterval(next, INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [slides.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restart timer when manually navigating
  const navigate = (idx: number, dir: 'left' | 'right') => {
    if (timerRef.current) clearInterval(timerRef.current);
    goTo(idx, dir);
    timerRef.current = setInterval(next, INTERVAL);
  };

  const slide = slides[current];
  const prevSlide = prev !== null ? slides[prev] : null;
  if (!slide) return null;

  // Slide-in/out classes based on direction
  const enterClass = direction === 'left'
    ? sliding ? 'translate-x-full' : 'translate-x-0'
    : sliding ? '-translate-x-full' : 'translate-x-0';

  const exitClass = direction === 'left' ? '-translate-x-full' : 'translate-x-full';

  return (
    <section className="relative h-[72vh] min-h-[500px] max-h-[800px] overflow-hidden bg-slate-900 select-none sm:h-[82vh] lg:h-[92vh]">

      {/* ── Exiting slide ── */}
      {prevSlide && (
        <div className={`absolute inset-0 transition-transform duration-500 ease-in-out ${exitClass}`}>
          <img src={prevSlide.imageUrl} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-900/60 to-slate-900/20" />
        </div>
      )}

      {/* ── Entering / active slide ── */}
      <div className={`absolute inset-0 transition-transform duration-500 ease-in-out ${enterClass}`}>
        <img
          src={slide.imageUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="eager"
        />
        {/* Gradient overlay — left-heavy for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/10" />
        {/* Bottom vignette */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-900/70 to-transparent" />
      </div>

      {/* ── Slide content ── */}
      <div
        key={slide.id}
        className={`relative flex h-full flex-col justify-center transition-all duration-500 ${sliding ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'}`}
      >
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="max-w-2xl">

            {/* Slide label pill */}
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-orange-300 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
              N_COLE Interpress
            </span>

            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-6xl">
              {slide.title}
            </h1>

            {slide.subtitle && (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-lg">
                {slide.subtitle}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
              {slide.buttonText && slide.buttonLink && (
                <Link
                  to={slide.buttonLink}
                  className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/40 transition hover:bg-orange-600 hover:shadow-orange-500/60 active:scale-95 sm:px-8 sm:py-3.5"
                >
                  {slide.buttonText} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-95 sm:px-8 sm:py-3.5"
              >
                Browse All
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-8 hidden flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300 sm:flex">
              {['Free delivery on all orders', 'MTN MoMo & Airtel Money', 'Verified vendors only'].map(t => (
                <span key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Progress bar ── */}
      {slides.length > 1 && (
        <div className="absolute top-0 inset-x-0 h-0.5 bg-white/10">
          <div
            className="h-full bg-orange-500 transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* ── Dot indicators ── */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => navigate(i, i > current ? 'left' : 'right')}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-8 h-2.5 bg-orange-500 shadow-lg shadow-orange-500/50'
                  : 'w-2.5 h-2.5 bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* ── Slide counter ── */}
      {slides.length > 1 && (
        <div className="absolute bottom-7 right-6 text-xs font-bold tabular-nums text-white/40 lg:right-10">
          <span className="text-white/80">{String(current + 1).padStart(2, '0')}</span>
          {' / '}
          {String(slides.length).padStart(2, '0')}
        </div>
      )}

      {/* ── Arrow controls ── */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => navigate(current - 1, 'right')}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25 hover:scale-110 active:scale-95 lg:left-8"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate(current + 1, 'left')}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25 hover:scale-110 active:scale-95 lg:right-8"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* ── Vertical slide thumbnails (desktop only) ── */}
      {slides.length > 1 && (
        <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-2 lg:flex lg:right-24">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => navigate(i, i > current ? 'left' : 'right')}
              aria-label={`Slide ${i + 1}`}
              className={`relative h-14 w-20 overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                i === current
                  ? 'border-orange-500 scale-105 shadow-lg shadow-orange-500/30'
                  : 'border-white/20 opacity-50 hover:opacity-80'
              }`}
            >
              <img src={s.imageUrl} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default Hero;
