import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await api.settings.get();
      setCurrencySymbol(data.currency_symbol);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateCurrency = useCallback(async (symbol) => {
    const data = await api.settings.update({ currency_symbol: symbol });
    setCurrencySymbol(data.currency_symbol);
  }, []);

  return (
    <SettingsContext.Provider value={{ currencySymbol, loaded, updateCurrency, refresh }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
