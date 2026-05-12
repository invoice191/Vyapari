import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface DataContextType {
  lastUpdate: Record<string, number>;
  refresh: (table: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [lastUpdate, setLastUpdate] = useState<Record<string, number>>({});

  const refresh = (table: string) => {
    setLastUpdate(prev => ({ ...prev, [table]: Date.now() }));
    // Broadcast for cross-component or cross-tab if needed
    window.dispatchEvent(new CustomEvent('app:data-refresh', { detail: { table } }));
  };

  useEffect(() => {
    // Global listener for data-refresh events
    const handleRefresh = (e: any) => {
      const table = e.detail?.table;
      if (table) {
        setLastUpdate(prev => ({ ...prev, [table]: Date.now() }));
      }
    };

    window.addEventListener('app:data-refresh', handleRefresh);
    return () => window.removeEventListener('app:data-refresh', handleRefresh);
  }, []);

  return (
    <DataContext.Provider value={{ lastUpdate, refresh }}>
      {children}
    </DataContext.Provider>
  );
}

export function useDataRefresh() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataRefresh must be used within a DataProvider');
  }
  return context;
}
