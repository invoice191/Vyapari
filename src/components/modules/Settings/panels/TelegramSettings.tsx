import React, { useState, useEffect, useCallback } from 'react';
import { Send, Smartphone, Bell, CheckCircle2, Loader2, RefreshCw, XCircle, Trash2, Copy, Check, Monitor, ArrowRight } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { toast } from 'sonner';

export const TelegramSettings = ({ data, onChange }: { data: any; onChange: (key: string, val: any) => void }) => {
  const [testing, setTesting] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [connectCode, setConnectCode] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const botUsername = 'Vyaparii_bot';

  const generateCode = useCallback(async () => {
    if (!data?.id || data?.telegram_chat_id) return;
    try {
      const { data: res, error } = await supabase.functions.invoke('telegram-generate-code', {
        body: { business_id: data.id }
      });
      if (error) throw error;
      setConnectCode(res.code);
      setExpiresIn(res.expires_in || 600);
    } catch (err) {
      console.error('Failed to generate connect code:', err);
    }
  }, [data?.id, data?.telegram_chat_id]);

  // Initial code generation
  useEffect(() => {
    if (data && !data.telegram_chat_id && !connectCode) {
      generateCode();
    }
  }, [data, connectCode, generateCode]);

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
    if (!data?.telegram_chat_id && data?.id) {
      poll = setInterval(async () => {
        const { data: business } = await supabase
          .from('businesses')
          .select('telegram_chat_id, telegram_notifications_enabled')
          .eq('id', data.id)
          .single();
        
        if (business?.telegram_chat_id) {
          onChange('telegram_chat_id', business.telegram_chat_id);
          onChange('telegram_notifications_enabled', true);
          setWaiting(false);
          setConnectCode(null);
          clearInterval(poll);
          toast.success('Telegram Connected! 🎉');
        }
      }, 3000);
    }
    return () => clearInterval(poll);
  }, [data?.telegram_chat_id, data?.id, onChange]);

  const handleConnectMobile = () => {
    const deepLink = `https://t.me/${botUsername}?start=${data.id}`;
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

  const handleSendTest = async () => {
    setTesting(true);
    try {
      const { error } = await supabase.functions.invoke('telegram-digest', {
        body: { test: true, business_id: data.id }
      });
      if (error) throw error;
      toast.success('Test signal transmitted!');
    } catch (err) {
      toast.error('Signal transmission failure');
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    onChange('telegram_chat_id', null);
    onChange('telegram_notifications_enabled', false);
    setConnectCode(null);
    setTimeout(() => generateCode(), 500);
    toast.success('Telegram Disconnected');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8 mt-8">
      {!data.telegram_chat_id ? (
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
              <Smartphone size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-white font-display">Connect Telegram</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Choose the method that works best for your device</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mobile Method */}
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 space-y-4 flex flex-col">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand">
                <Smartphone size={14} />
                On Mobile?
              </div>
              <p className="text-xs text-slate-400 leading-relaxed flex-grow">
                Open Telegram directly on your phone and tap the START button to link instantly.
              </p>
              <button 
                onClick={handleConnectMobile}
                className="w-full flex items-center justify-center gap-2 py-3 bg-brand hover:bg-brand/90 text-white rounded-xl font-black text-xs transition-all active:scale-95 shadow-lg shadow-brand/20"
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
                  className="text-[9px] font-black uppercase tracking-widest text-brand hover:text-brand/80 transition-colors"
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-white font-display">Telegram Connected</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">System operational • Real-time intelligence active</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { id: 'telegram_notifications_enabled', label: 'Daily Digest 9 PM' },
              { id: 'telegram_low_stock_alerts', label: 'Low Stock Alerts' },
              { id: 'telegram_invoice_alerts', label: 'Invoice Alerts' },
              { id: 'telegram_large_order_alerts', label: 'Large Order Alerts' }
            ].map((toggle) => (
              <div key={toggle.id} className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <span className="text-sm font-bold text-slate-300">{toggle.label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={data[toggle.id]} 
                    onChange={(e) => onChange(toggle.id, e.target.checked)} 
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                </label>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              onClick={handleSendTest}
              disabled={testing}
              className="flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-all disabled:opacity-50"
            >
              {testing ? <Loader2 size={18} className="animate-spin text-brand" /> : <Send size={18} className="text-brand" />}
              <span className="text-xs font-black uppercase tracking-widest text-white">Send Test Message</span>
            </button>
            <button 
              onClick={handleDisconnect}
              className="px-8 py-4 rounded-2xl border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-500/5 transition-all"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
