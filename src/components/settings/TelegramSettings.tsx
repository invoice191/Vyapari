import React, { useState, useEffect, useCallback } from 'react';
import { Send, Smartphone, Bell, CheckCircle2, Loader2, RefreshCw, XCircle, Trash2, Copy, Check, Monitor, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

const TelegramSettings: React.FC = () => {
  const { business } = useAuth();
  const [bizData, setBizData] = useState<any>(null);
  const [waiting, setWaiting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [testing, setTesting] = useState(false);
  const [connectCode, setConnectCode] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const botUsername = 'Vyaparii_bot';

  const fetchBusiness = useCallback(async () => {
    if (!business?.id) return;
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', business.id)
      .single();
    if (data) setBizData(data);
  }, [business?.id]);

  useEffect(() => {
    fetchBusiness();
  }, [fetchBusiness]);

  const generateCode = useCallback(async () => {
    if (!business?.id || bizData?.telegram_chat_id) return;
    try {
      const { data, error } = await supabase.functions.invoke('telegram-generate-code', {
        body: { business_id: business.id }
      });
      if (error) throw error;
      setConnectCode(data.code);
      setExpiresIn(data.expires_in || 600);
    } catch (err) {
      console.error('Failed to generate connect code:', err);
    }
  }, [business?.id, bizData?.telegram_chat_id]);

  // Initial code generation
  useEffect(() => {
    if (bizData && !bizData.telegram_chat_id && !connectCode) {
      generateCode();
    }
  }, [bizData, connectCode, generateCode]);

  // Countdown and refresh logic
  useEffect(() => {
    if (!connectCode || expiresIn <= 0) return;
    const timer = setInterval(() => {
      setExpiresIn(prev => {
        if (prev <= 1) {
          generateCode();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [connectCode, expiresIn, generateCode]);

  // Polling logic for connection status
  useEffect(() => {
    let poll: any;
    if (!bizData?.telegram_chat_id && business?.id) {
      poll = setInterval(async () => {
        const { data } = await supabase
          .from('businesses')
          .select('telegram_chat_id, telegram_notifications_enabled')
          .eq('id', business.id)
          .single();
        
        if (data?.telegram_chat_id) {
          setBizData(prev => ({ ...prev, ...data }));
          setWaiting(false);
          setConnectCode(null);
          clearInterval(poll);
          toast.success('Telegram Connected! --');
        }
      }, 3000);
    }
    return () => clearInterval(poll);
  }, [bizData?.telegram_chat_id, business?.id]);

  const handleConnectMobile = () => {
    const deepLink = `https://t.me/${botUsername}?start=${business?.id}`;
    window.location.href = deepLink;
    setWaiting(true);
  };

  const handleOpenBot = () => {
    window.open(`https://t.me/${botUsername}`, '_blank');
  };

  const handleCopyCode = () => {
    if (!connectCode) return;
    navigator.clipboard.writeText(`/connect ${connectCode}`);
    setCopied(true);
    toast.success('Command copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggle = async (field: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ [field]: value })
        .eq('id', business?.id);
      if (error) throw error;
      setBizData({ ...bizData, [field]: value });
      toast.success("Preference updated");
    } catch (err) {
      toast.error("Failed to update preference");
    }
  };

  const handleSendTest = async () => {
    setTesting(true);
    try {
      const { error } = await supabase.functions.invoke('telegram-digest', {
        body: { test: true, business_id: business?.id }
      });
      if (error) throw error;
      toast.success("Test signal transmitted!");
    } catch (err) {
      toast.error("Signal transmission failure");
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Telegram?")) return;
    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          telegram_chat_id: null,
          telegram_notifications_enabled: false
        })
        .eq('id', business?.id);
      if (error) throw error;
      setBizData({ ...bizData, telegram_chat_id: null, telegram_notifications_enabled: false });
      setConnectCode(null);
      generateCode();
      toast.success("Telegram disconnected");
    } catch (err) {
      toast.error("Failed to disconnect");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!bizData) return null;

  return (
    <div className="glass-card !bg-white/5 !border-white/10 !p-8 relative overflow-hidden">
      {!bizData.telegram_chat_id ? (
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Smartphone size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Connect Telegram</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Choose the method that works best for your device</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mobile Method */}
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-4 flex flex-col">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400">
                <Smartphone size={14} />
                On Mobile?
              </div>
              <p className="text-xs text-slate-400 leading-relaxed flex-grow">
                Open Telegram directly on your phone and tap the START button to link instantly.
              </p>
              <button 
                onClick={handleConnectMobile}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs transition-all active:scale-95 shadow-lg shadow-blue-600/20"
              >
                Open Telegram App
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Desktop Method */}
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-4 flex flex-col">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                <Monitor size={14} />
                On Desktop?
              </div>
              <div className="text-xs text-slate-400 leading-relaxed flex-grow">
                Step 1: Open <span className="text-white font-bold cursor-pointer hover:underline" onClick={handleOpenBot}>@{botUsername}</span><br/>
                Step 2: Send this code to the bot:
              </div>
              
              <div className="relative group">
                <div className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-center">
                  {connectCode ? (
                    <span className="text-lg font-black tracking-widest text-white font-mono">{connectCode}</span>
                  ) : (
                    <Loader2 size={20} className="animate-spin text-slate-600 mx-auto" />
                  )}
                </div>
                {connectCode && (
                  <button 
                    onClick={handleCopyCode}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                    title="Copy command"
                  >
                    {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                  {connectCode ? `Expires in ${formatTime(expiresIn)}` : 'Generating code...'}
                </div>
                <button 
                  onClick={generateCode}
                  className="text-[9px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Refresh Code
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-8 pt-4 border-t border-white/5">
            {['Secure pairing', 'Encrypted data', 'No password'].map((tag, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <CheckCircle2 size={12} className="text-emerald-500" />
                {tag}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Telegram Connected</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Daily updates arriving at 9 PM IST</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: 'telegram_notifications_enabled', label: 'Daily Digest 9 PM' },
              { id: 'telegram_low_stock_alerts', label: 'Low Stock Alerts' },
              { id: 'telegram_invoice_alerts', label: 'Invoice Alerts' },
              { id: 'telegram_large_order_alerts', label: 'Large Order Alerts' }
            ].map((toggle) => (
              <div key={toggle.id} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 transition-all">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">{toggle.label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={bizData[toggle.id]} 
                    onChange={(e) => handleToggle(toggle.id, e.target.checked)} 
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <button 
              onClick={handleSendTest}
              disabled={testing}
              className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-600/10 disabled:opacity-50"
            >
              {testing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Send Test Message
            </button>
            <button 
              onClick={handleDisconnect}
              className="px-8 py-4 rounded-2xl border-2 border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/5 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={14} />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelegramSettings;
