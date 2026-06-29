import React from 'react';
import { Lock, X } from 'lucide-react';

interface Props { onLogin: () => void; onClose: () => void; }

const AuthPromptModal: React.FC<Props> = ({ onLogin, onClose }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl animate-slide-in">
      <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-slate-100">
        <X className="h-4 w-4 text-slate-400" />
      </button>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
        <Lock className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-slate-900">Sign in required</h2>
      <p className="mt-2 text-sm text-slate-500">
        You need to be signed in to perform this action. It only takes 30 seconds!
      </p>
      <button
        onClick={onLogin}
        className="mt-6 w-full rounded-full bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
      >
        Sign In or Create Account
      </button>
      <button onClick={onClose} className="mt-2 w-full py-2 text-sm text-slate-400 hover:text-slate-600">
        Continue browsing
      </button>
    </div>
  </div>
);

export default AuthPromptModal;
