import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ShoppingBag, ArrowRight, X, Mail, KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/api';

const ForgotPasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError((err as Error).message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
          <X className="h-4 w-4" />
        </button>
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
          <Mail className="h-6 w-6 text-orange-600" />
        </div>
        {sent ? (
          <>
            <h2 className="text-xl font-bold text-slate-900">Check your email</h2>
            <p className="mt-2 text-sm text-slate-500">
              If <strong>{email}</strong> is registered, a password reset link has been sent.
              Check your spam folder if you don't see it within a few minutes.
            </p>
            <button onClick={onClose} className="mt-6 w-full rounded-full bg-orange-500 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition">
              Back to Sign In
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-slate-900">Forgot your password?</h2>
            <p className="mt-2 text-sm text-slate-500">
              Enter your email and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email Address</label>
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                />
              </div>
              {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">{error}</div>}
              <button type="submit" disabled={loading} className="w-full rounded-full bg-orange-500 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 transition">
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

const AuthPage: React.FC = () => {
  const { signIn, signInOtp, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from;

  const [mode, setMode] = useState<'in' | 'up'>(location.pathname === '/register' ? 'up' : 'in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  // OTP step
  const [otpStep, setOtpStep]   = useState(false);
  const [otpUserId, setOtpUserId] = useState('');
  const [otpCode, setOtpCode]   = useState('');

  const getRedirectPath = (role: string): string => {
    if (role === 'ADMIN')    return '/admin/dashboard';
    if (role === 'VENDOR')   return '/vendor/dashboard';
    if (role === 'RIDER')    return '/rider/dashboard';
    if (role === 'CUSTOMER') return '/customer/dashboard';
    return from && from !== '/login' && from !== '/register' ? from : '/customer/dashboard';
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const res = mode === 'in'
      ? await signIn(email, password)
      : await signUp(name, email, password);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    if (res.requiresOtp && res.userId) {
      setOtpUserId(res.userId);
      setOtpStep(true);
      return;
    }
    navigate(getRedirectPath(res.role ?? ''), { replace: true });
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await signInOtp(otpUserId, otpCode);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    navigate(getRedirectPath(res.role ?? ''), { replace: true });
  };

  // ── OTP screen ──────────────────────────────────────────────────────────
  if (otpStep) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 mx-auto">
            <KeyRound className="h-7 w-7 text-orange-500" />
          </div>
          <h1 className="text-center text-2xl font-bold text-slate-900">Verify Your Identity</h1>
          <p className="mt-2 text-center text-sm text-slate-500">
            A 6-digit code has been sent to your email. Enter it below to continue.
          </p>
          <form onSubmit={submitOtp} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-2xl font-mono tracking-widest outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
              />
            </div>
            {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">{error}</div>}
            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 py-3.5 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 active:scale-95 disabled:opacity-60"
            >
              {loading ? 'Verifying…' : 'Continue'} {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
          <button
            onClick={() => { setOtpStep(false); setOtpCode(''); setError(''); }}
            className="mt-4 w-full text-center text-xs text-slate-400 hover:text-slate-600"
          >
            ← Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
      <div className="flex min-h-[100dvh] bg-slate-50">
        {/* Left branding panel (desktop only) */}
        <div className="hidden flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950 p-12 lg:flex lg:w-[45%]">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <span className="block font-bold text-white text-lg leading-tight">N_COLE</span>
              <span className="block text-[10px] font-medium uppercase tracking-widest text-orange-400">Interpress</span>
            </div>
          </Link>
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Rwanda's Premier<br />Marketplace Platform
            </h2>
            <p className="mt-4 text-slate-400 leading-relaxed max-w-sm">
              Shop from thousands of verified vendors, track your orders in real time, and get AI-powered recommendations.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-5">
              {[['5,000+', 'Verified Vendors'], ['120K+', 'Products'], ['250K+', 'Customers'], ['1.2M+', 'Orders']].map(([v, l]) => (
                <div key={l} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <p className="text-2xl font-bold text-white">{v}</p>
                  <p className="text-sm text-slate-400">{l}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} N_COLE Interpress. All rights reserved.</p>
        </div>

        {/* Right form panel */}
        <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-6 sm:py-12"
          style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
        >
          <div className="w-full max-w-md">
            <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <span className="font-bold text-slate-900">N_COLE Interpress</span>
            </Link>

            <h1 className="text-2xl font-bold text-slate-900">
              {mode === 'in' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'in' ? 'Sign in to continue shopping' : 'Join thousands of happy customers'}
            </p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              {mode === 'up' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name</label>
                  <input required value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20" />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email Address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20" />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  {mode === 'in' && (
                    <button type="button" onClick={() => setShowForgot(true)}
                      className="text-xs font-medium text-orange-600 hover:text-orange-700">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} required minLength={8}
                    value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20" />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">{error}</div>}

              <button type="submit" disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 py-3.5 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600 active:scale-95 disabled:opacity-60">
                {loading ? 'Please wait…' : mode === 'in' ? 'Sign In' : 'Create Account'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              {mode === 'in' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setError(''); }}
                className="font-semibold text-orange-600 hover:text-orange-700">
                {mode === 'in' ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
            <p className="mt-3 text-center text-sm text-slate-500">
              Want to sell or deliver?{' '}
              <Link to="/apply" className="font-semibold text-orange-600 hover:text-orange-700">Apply as Vendor / Rider</Link>
            </p>
            <div className="mt-6 text-center">
              <Link to="/" className="text-xs text-slate-400 hover:text-slate-600">← Back to store</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthPage;
