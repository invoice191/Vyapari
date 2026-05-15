import React, { useEffect, useState } from 'react';
import { Activity, Clock, User, Shield, Key, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Log {
  id: string;
  action: string;
  metadata: any;
  created_at: string;
  user_id: string;
}

const ActivityFeed: React.FC = () => {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.business_id) return;

    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('business_id', profile.business_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setLogs(data);
      }
      setLoading(false);
    };

    fetchLogs();

    // Real-time subscription
    const channel = supabase
      .channel('team_activity')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'audit_logs',
        filter: `business_id=eq.${profile.business_id}`
      }, (payload) => {
        setLogs(prev => [payload.new as Log, ...prev].slice(0, 10));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.business_id]);

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN')) return <Key className="text-blue-500" size={16} />;
    if (action.includes('CREATED')) return <User className="text-emerald-500" size={16} />;
    if (action.includes('PROVISION')) return <Shield className="text-purple-500" size={16} />;
    return <Activity className="text-slate-500" size={16} />;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Live Activity Feed</h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Real-time security & operation audit</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 animate-pulse h-24" />
          ))
        ) : logs.length > 0 ? (
          logs.map((log) => (
            <div key={log.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-4 hover:border-slate-200 transition-all">
              <div className="p-3 bg-slate-50 rounded-2xl">
                {getActionIcon(log.action)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-slate-900 text-sm uppercase tracking-tight">{log.action.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-slate-500 text-xs font-medium">
                  {log.metadata?.email || log.metadata?.full_name || 'System Action'} 
                  {log.action.includes('CREATED') ? ' was initialized in the system' : ' triggered a security event'}
                </p>
                <div className="mt-3 flex gap-2">
                  <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    ID: {log.id.slice(0, 8)}
                  </span>
                  <span className="px-2 py-0.5 bg-blue-50 rounded-md text-[9px] font-black text-blue-500 uppercase tracking-widest">
                    {log.metadata?.role || 'SYSTEM'}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-[3rem] border border-dashed border-slate-200 text-center">
            <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
            <h4 className="font-black text-slate-900 uppercase tracking-tight">No Activity Logged</h4>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Activity will appear here in real-time</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
