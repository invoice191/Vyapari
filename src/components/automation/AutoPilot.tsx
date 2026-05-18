import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Bot, Clock, MessageSquare, Zap, Activity, Mail, 
  IndianRupee, Phone, Settings, ToggleLeft, ToggleRight,
  CheckCircle2, AlertTriangle, ShieldCheck, Play
} from 'lucide-react';
import { Card, SectionHeader, ActionBtn as Button, Badge } from '../common/UI';
import { useToast } from '../common/Toast';
import { useAuth } from '../../context/AuthContext';
import { automationService } from '../../services/automationService';
import SmartDunning from './SmartDunning';
import ProcurementAgent from '../purchases/ProcurementAgent';

export default function AutoPilot() {
  const { toast } = useToast();
  const { profile, user } = useAuth();
  const [running, setRunning] = useState(false);
  const [liveLogs, setLiveLogs] = useState<any[]>([
    { id: 1, time: 'System Ready', action: 'Daemon Initialized', target: 'Auto-Pilot', detail: 'Waiting for triggers', status: 'success' },
  ]);
  
  // Mock config state
  const [config, setConfig] = useState({
    autoDunning: true,
    dunningDaysBefore: 3,
    dunningDaysAfter: 5,
    autoLateFee: false,
    lateFeePercent: 2,
    autoRestock: true,
    restockThreshold: 10,
    dailyBriefing: true,
    briefingTime: '08:00'
  });

  const [activeSubView, setActiveSubView] = useState<'main' | 'dunning' | 'procurement'>('main');

  useEffect(() => {
    const handleNav = (e: any) => {
      if (e.detail?.module === 'autopilot' && e.detail?.props?.subview) {
        setActiveSubView(e.detail.props.subview);
      }
    };
    window.addEventListener('app:navigate', handleNav);
    return () => window.removeEventListener('app:navigate', handleNav);
  }, []);

  const toggle = (key: keyof typeof config) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] as any }));
    toast(`Automation setting updated`, 'success');
  };

  const executeNow = async () => {
    if (!profile?.business_id || !user) return;
    setRunning(true);
    toast("Starting Auto-Pilot Daemon...", "info");
    
    const result = await automationService.runAutoPilot(profile.business_id, user.id, user.email || 'system', config);
    
    if (result.success && result.logs && result.logs.length > 0) {
      const newLogs = result.logs.map((l: any, i: number) => ({
        ...l, id: Date.now() + i, time: 'Just now'
      }));
      setLiveLogs(prev => [...newLogs, ...prev].slice(0, 15)); // Keep last 15
      toast(`Successfully executed ${result.logs.length} automated jobs`, "success");
    } else if (result.success) {
      toast("No jobs met the criteria to run right now.", "info");
    } else {
      toast("Auto-Pilot execution failed.", "error");
    }
    setRunning(false);
  };

  const logs = liveLogs;

  if (activeSubView === 'dunning') {
    return (
      <div className="space-y-6">
        <button onClick={() => setActiveSubView('main')} className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">← Back to Overview</button>
        <SmartDunning />
      </div>
    );
  }

  if (activeSubView === 'procurement') {
    return (
      <div className="space-y-6">
        <button onClick={() => setActiveSubView('main')} className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">← Back to Overview</button>
        <ProcurementAgent />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="relative overflow-hidden bg-slate-950 rounded-2xl p-8 border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <Bot size={12} /> Auto-Pilot Active
            </div>
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} className="text-emerald-400" /> System is running
            </div>
          </div>
          
          <h1 className="text-4xl font-black text-white tracking-tighter mb-4 leading-none uppercase">
            Business <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Auto-Pilot</span>
          </h1>
          <p className="text-slate-300 text-sm font-medium max-w-2xl leading-relaxed">
            Vyapari automatically handles your routine tasks in the background. It chases payments, orders stock, and sends you daily briefings so you can focus on growth.
          </p>
          
          <button 
            onClick={executeNow}
            disabled={running}
            className={`mt-8 px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 transition-all ${running ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-400 hover:text-white'}`}
          >
            {running ? <Activity size={18} className="animate-spin" /> : <Play size={18} />}
            {running ? "Executing Jobs..." : "Force Run Now"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <SectionHeader title="Automation Rules" subtitle="Configure background tasks" />

          {/* Rule 1: Auto Dunning */}
          <AutomationCard 
            icon={<MessageSquare className="text-emerald-500" />}
            title="Automated Payment Reminders"
            description="Automatically send polite WhatsApp and Email reminders to customers before and after their invoice is due."
            active={config.autoDunning}
            onToggle={() => toggle('autoDunning')}
          >
            <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-100">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Pre-Due Reminder</label>
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <Clock size={16} className="text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">{config.dunningDaysBefore} Days before due</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Overdue Follow-up</label>
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <AlertTriangle size={16} className="text-amber-500" />
                  <span className="text-sm font-bold text-slate-700">Every {config.dunningDaysAfter} Days</span>
                </div>
              </div>
            </div>
          </AutomationCard>

          {/* Rule 2: Auto Late Fees */}
          <AutomationCard 
            icon={<IndianRupee className="text-rose-500" />}
            title="Automatic Late Fees"
            description="If a customer ignores reminders, automatically add a percentage penalty to their invoice."
            active={config.autoLateFee}
            onToggle={() => toggle('autoLateFee')}
          >
            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between bg-rose-50/50 p-4 rounded-xl border border-rose-100">
              <span className="text-sm font-bold text-slate-700">Penalty applied after 10 days overdue</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-rose-600">{config.lateFeePercent}%</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Monthly</span>
              </div>
            </div>
          </AutomationCard>

          {/* Rule 3: Auto Restock */}
          <AutomationCard 
            icon={<Zap className="text-indigo-500" />}
            title="Auto-Restock Emails"
            description="When inventory hits safety levels, automatically draft and send a restock email to your supplier."
            active={config.autoRestock}
            onToggle={() => toggle('autoRestock')}
          />

          {/* Rule 4: Sentiment Dunning Launch */}
          <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000" />
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                      <MessageSquare size={24} className="text-white" />
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tight">Sentiment Dunning Console</h3>
                </div>
                <p className="text-white/70 font-medium mb-8 max-w-md">
                   Go beyond basic automation. Use the Neural Sentiment Engine to analyze customer relationships and craft perfect recovery messages.
                </p>
                <button 
                  onClick={() => setActiveSubView('dunning')}
                  className="px-8 py-4 bg-neon text-ink rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                   Launch Intelligence Console
                </button>
             </div>
          </div>
        </div>

        {/* Sidebar: Activity Log */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="p-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-2">
               <Activity size={14} className="text-indigo-500" /> Background Activity
            </h4>
            <div className="space-y-6">
              {logs.map(log => (
                <div key={log.id} className="relative pl-6 border-l-2 border-slate-100">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-indigo-500" />
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{log.time}</div>
                  <div className="text-sm font-bold text-slate-800 mb-1">{log.action}</div>
                  <div className="text-[11px] font-medium text-slate-500 mb-2">Target: {log.target}</div>
                  <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded inline-block ${
                    log.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {log.detail}
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-8 py-3 bg-slate-50 hover:bg-slate-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">
              View All Logs
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AutomationCard({ icon, title, description, active, onToggle, children }: any) {
  return (
    <Card className={`p-8 transition-all duration-300 border-2 ${active ? 'border-indigo-500/20 shadow-xl' : 'border-slate-100 opacity-70'}`}>
      <div className="flex justify-between items-start">
        <div className="flex gap-5 items-start">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? 'bg-slate-900 shadow-lg' : 'bg-slate-100'}`}>
            {icon}
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">{title}</h3>
            <p className="text-sm font-medium text-slate-500 max-w-md">{description}</p>
          </div>
        </div>
        <button onClick={onToggle} className="text-slate-400 hover:text-indigo-600 transition-colors">
          {active ? <ToggleRight size={40} className="text-indigo-600" /> : <ToggleLeft size={40} />}
        </button>
      </div>
      {active && children}
    </Card>
  );
}
