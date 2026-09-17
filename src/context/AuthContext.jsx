import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

// 'loading' | 'needsSetup' | 'locked' | 'unlocked'
export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading');

  const boot = useCallback(async () => {
    try {
      const { pinSet } = await api.auth.status();
      if (!pinSet) {
        setStatus('needsSetup');
        return;
      }
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (!token) {
        setStatus('locked');
        return;
      }
      try {
        await api.settings.get();
        setStatus('unlocked');
      } catch {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        setStatus('locked');
      }
    } catch {
      setStatus('locked');
    }
  }, []);

  useEffect(() => {
    boot();
  }, [boot]);

  const setPin = useCallback(async (pin) => {
    const { token } = await api.auth.setPin(pin);
    localStorage.setItem('auth_token', token);
    setStatus('unlocked');
  }, []);

  const verifyPin = useCallback(async (pin, remember) => {
    const { token } = await api.auth.verifyPin(pin, remember);
    if (remember) {
      localStorage.setItem('auth_token', token);
    } else {
      sessionStorage.setItem('auth_token', token);
    }
    setStatus('unlocked');
  }, []);

  const changePin = useCallback(async (oldPin, newPin) => {
    await api.auth.changePin(oldPin, newPin);
  }, []);

  const lock = useCallback(() => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    setStatus('locked');
  }, []);

  return (
    <AuthContext.Provider value={{ status, setPin, verifyPin, changePin, lock }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
