import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Returns a wrapper that checks auth before executing an action.
// If unauthenticated, shows the login prompt modal and redirects.
export function useAuthGuard() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPrompt, setShowPrompt] = useState(false);

  const guard = useCallback(
    <T extends unknown[]>(fn: (...args: T) => void) =>
      (...args: T) => {
        if (!isAuthenticated) { setShowPrompt(true); return; }
        fn(...args);
      },
    [isAuthenticated],
  );

  const closePrompt = () => setShowPrompt(false);
  const goLogin = () => { setShowPrompt(false); navigate('/login'); };

  return { guard, showPrompt, closePrompt, goLogin };
}
