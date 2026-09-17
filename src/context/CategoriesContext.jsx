import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const CategoriesContext = createContext(null);

export function CategoriesProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const data = await api.categories.list();
    setCategories(data);
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <CategoriesContext.Provider value={{ categories, loaded, refresh }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  return useContext(CategoriesContext);
}
