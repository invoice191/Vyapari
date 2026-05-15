import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { smsService } from '../services/smsService';

interface DataContextType {
  products: any[];
  invoices: any[];
  contacts: any[];
  ledger: any[];
  purchaseOrders: any[];
  stockMovements: any[];
  categories: any[];
  loading: boolean;
  isDeferredLoading: boolean;
  refresh: (table?: string) => Promise<void>;
}

const DataContext = createContext<DataContextType>({
  products: [],
  invoices: [],
  contacts: [],
  ledger: [],
  purchaseOrders: [],
  stockMovements: [],
  categories: [],
  loading: true,
  isDeferredLoading: false,
  refresh: async () => {},
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [stockMovements, setStockMovements] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeferredLoading, setIsDeferredLoading] = useState(true);

  const fetchTable = async (table: string) => {
    if (!profile?.business_id) {
      console.warn(`[DataContext] Attempted to fetch ${table} without business_id. Profile state:`, profile);
      return [];
    }
    
    const startTime = performance.now();
    try {
      console.log(`[DataContext] Fetching ${table} for business: ${profile.business_id}`);
      let selectClause = '*';
      if (table === 'ledger_entries') selectClause = '*, contacts(name)';
      else if (table === 'invoices') selectClause = '*, contacts(name, phone)';

      let query = supabase
        .from(table)
        .select(selectClause)
        .eq('business_id', profile.business_id);

      if (table === 'ledger_entries') {
        query = query.order('timestamp', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(1000);
      if (error) throw error;
      
      const duration = (performance.now() - startTime).toFixed(2);
      console.log(`[DataContext] Successfully fetched ${data?.length || 0} rows from ${table} in ${duration}ms`);

      // Ensure data is sorted by created_at DESC or timestamp DESC
      const sortedData = (data || []).sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || a.timestamp || 0).getTime();
        const dateB = new Date(b.created_at || b.timestamp || 0).getTime();
        return dateB - dateA;
      });

      return sortedData;
    } catch (err) {
      console.error(`[DataContext] Error fetching ${table}:`, err);
      return [];
    }
  };

  const refreshAll = async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    setIsDeferredLoading(true);
    try {
      const [prodData, invData, conData, poData, moveData, catData] = await Promise.all([
        fetchTable('products'),
        fetchTable('invoices'),
        fetchTable('contacts'),
        fetchTable('purchase_orders'),
        fetchTable('stock_movements'),
        fetchTable('categories'),
      ]);
      setProducts(prodData);
      setInvoices(invData);
      setContacts(conData);
      setPurchaseOrders(poData);
      setStockMovements(moveData);
      setCategories(catData);
      setLoading(false);

      // Deferred tier for heavy tables
      setTimeout(async () => {
        try {
          const ledData = await fetchTable('ledger_entries');
          setLedger(ledData);
        } catch (err) {
          console.error("[DataContext] Error in deferred load:", err);
        } finally {
          setIsDeferredLoading(false);
        }
      }, 5000);

    } catch (err) {
      console.error("[DataContext] Error refreshing data:", err);
      setLoading(false);
      setIsDeferredLoading(false);
    }
  };

  const refresh = async (table?: string) => {
    if (!profile?.business_id) return;
    if (!table) {
      await refreshAll();
      return;
    }

    try {
      const actualTable = table === 'ledger' ? 'ledger_entries' : table;
      const data = await fetchTable(actualTable);
      if (table === 'products') setProducts(data);
      else if (table === 'invoices') setInvoices(data);
      else if (table === 'contacts') setContacts(data);
      else if (table === 'purchase_orders') setPurchaseOrders(data);
      else if (table === 'stock_movements') setStockMovements(data);
      else if (table === 'categories') setCategories(data);
      else if (table === 'ledger' || table === 'ledger_entries') setLedger(data);
    } catch (err) {
      console.error(`[DataContext] Error refreshing table ${table}:`, err);
    }
  };

  useEffect(() => {
    if (profile?.business_id) {
      refreshAll();

      console.log(`[DataContext] Initializing real-time subscriptions for business: ${profile.business_id}`);
      const channel = supabase
        .channel(`db-changes-${profile.business_id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products', filter: `business_id=eq.${profile.business_id}` },
          (payload) => {
            console.log(`[Realtime] ${payload.table} change:`, payload.eventType);
            if (payload.eventType === 'INSERT') {
              setProducts(prev => [payload.new, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
            } else if (payload.eventType === 'DELETE') {
              setProducts(prev => prev.filter(p => p.id !== (payload.old as any).id));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'invoices', filter: `business_id=eq.${profile.business_id}` },
          async (payload) => {
            console.log(`[Realtime] ${payload.table} change:`, payload.eventType);
            if (payload.eventType === 'INSERT') {
              // Fetch full joined data for the new invoice to ensure UI consistency
              const { data } = await supabase
                .from('invoices')
                .select('*, contacts(name, phone)')
                .eq('id', payload.new.id)
                .single()
                .then(({ data }) => {
                  if (data) {
                    setInvoices(prev => [data, ...prev]);
                  } else {
                    setInvoices(prev => [payload.new, ...prev]);
                  }
                })
                .catch(err => {
                  console.error("[Realtime] Error fetching invoice detail:", err);
                  setInvoices(prev => [payload.new, ...prev]);
                });
            } else if (payload.eventType === 'UPDATE') {
              // Try to preserve existing contact data if payload.new doesn't have it
              setInvoices(prev => prev.map(i => {
                if (i.id === payload.new.id) {
                  return { ...i, ...payload.new };
                }
                return i;
              }));
            } else if (payload.eventType === 'DELETE') {
              setInvoices(prev => prev.filter(i => i.id !== (payload.old as any).id));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'contacts', filter: `business_id=eq.${profile.business_id}` },
          (payload) => {
            console.log(`[Realtime] ${payload.table} change:`, payload.eventType);
            if (payload.eventType === 'INSERT') {
              setContacts(prev => [payload.new, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setContacts(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
            } else if (payload.eventType === 'DELETE') {
              setContacts(prev => prev.filter(c => c.id !== (payload.old as any).id));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'ledger_entries', filter: `business_id=eq.${profile.business_id}` },
          (payload) => {
            console.log(`[Realtime] ${payload.table} change:`, payload.eventType);
            if (payload.eventType === 'INSERT') {
              setLedger(prev => [payload.new, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setLedger(prev => prev.map(l => l.id === payload.new.id ? payload.new : l));
            } else if (payload.eventType === 'DELETE') {
              setLedger(prev => prev.filter(l => l.id !== (payload.old as any).id));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'purchase_orders', filter: `business_id=eq.${profile.business_id}` },
          (payload) => {
            console.log(`[Realtime] ${payload.table} change:`, payload.eventType);
            if (payload.eventType === 'INSERT') {
              setPurchaseOrders(prev => [payload.new, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setPurchaseOrders(prev => prev.map(po => po.id === payload.new.id ? payload.new : po));
            } else if (payload.eventType === 'DELETE') {
              setPurchaseOrders(prev => prev.filter(po => po.id !== (payload.old as any).id));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'stock_movements', filter: `business_id=eq.${profile.business_id}` },
          (payload) => {
            console.log(`[Realtime] ${payload.table} change:`, payload.eventType);
            if (payload.eventType === 'INSERT') {
              setStockMovements(prev => [payload.new, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setStockMovements(prev => prev.map(sm => sm.id === payload.new.id ? payload.new : sm));
            } else if (payload.eventType === 'DELETE') {
              setStockMovements(prev => prev.filter(sm => sm.id !== (payload.old as any).id));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'categories', filter: `business_id=eq.${profile.business_id}` },
          (payload) => {
            console.log(`[Realtime] ${payload.table} change:`, payload.eventType);
            if (payload.eventType === 'INSERT') {
              setCategories(prev => [payload.new, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setCategories(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
            } else if (payload.eventType === 'DELETE') {
              setCategories(prev => prev.filter(c => c.id !== (payload.old as any).id));
            }
          }
        )
        .subscribe((status) => {
          console.log(`[Realtime] Subscription status for ${profile.business_id}:`, status);
        });

      return () => {
        console.log(`[Realtime] Cleaning up subscriptions for ${profile.business_id}`);
        supabase.removeChannel(channel);
      };
    } else {
      setProducts([]);
      setInvoices([]);
      setContacts([]);
      setLedger([]);
      setLoading(false);
      setIsDeferredLoading(false);
    }
  }, [profile?.business_id]);

  // Background Queue Processor (Poor man's cron)
  useEffect(() => {
    if (!profile?.business_id) return;
    
    const processQueue = async () => {
      try {
        console.log("[QueueProcessor] Triggering background queue process...");
        await smsService.processQueue();
      } catch (err) {
        console.error("[QueueProcessor] Background process failed:", err);
      }
    };

    // Trigger once on load
    processQueue();

    // Then every 60 seconds
    const interval = setInterval(processQueue, 60000);
    return () => clearInterval(interval);
  }, [profile?.business_id]);


  return (
    <DataContext.Provider value={{ 
      products, invoices, contacts, ledger, 
      purchaseOrders, stockMovements, categories,
      loading, isDeferredLoading, refresh 
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useGlobalData = () => useContext(DataContext);
