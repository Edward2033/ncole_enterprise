import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShoppingBag, CheckCircle, AlertCircle } from 'lucide-react';
import { authService } from '@/services/api';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError('Invalid or missing reset token. Please request a new password reset link.');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err) {
      setError((err as Error).message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <span className="font-bold text-slate-900 text-lg">N_COLE Interpress</span>
        </Link>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          {success ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-7 w-7 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Password Reset Successful</h1>
              <p className="mt-2 text-sm text-slate-500">
                Your password has been updated. Redirecting you to sign in…
              </p>
              <Link to="/login"
                className="mt-6 inline-block rounded-full bg-orange-500 px-8 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition">
                Sign In Now
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-900">Set a new password</h1>
              <p className="mt-1 text-sm text-slate-500">
                Choose a strong password of at least 8 characters.
              </p>

              {!token && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Invalid or missing reset token. Please <Link to="/login" className="underline font-medium">request a new link</Link>.</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">New Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required minLength={8}
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      disabled={!token}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 disabled:opacity-50"
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Confirm Password</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    disabled={!token}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 disabled:opacity-50"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full rounded-full bg-orange-500 py-3.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 transition active:scale-95"
                >
                  {loading ? 'Resetting…' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Remember your password?{' '}
          <Link to="/login" className="font-semibold text-orange-600 hover:text-orange-700">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
