import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { flushQueue } from '../api/client';
import { queueLength } from '../utils/offlineQueue';

const NetworkContext = createContext(null);

export function NetworkProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(queueLength());

  const sync = useCallback(async () => {
    if (!navigator.onLine) return;
    await flushQueue();
    setPending(queueLength());
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      sync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    sync();

    const interval = setInterval(() => setPending(queueLength()), 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [sync]);

  const notifyQueued = useCallback(() => setPending(queueLength()), []);

  return (
    <NetworkContext.Provider value={{ isOnline, pending, sync, notifyQueued }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
