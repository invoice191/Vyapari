import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, Briefcase, Target, TrendingUp, Calendar, 
  Clock, DollarSign, Activity, Receipt, Award, 
  CheckCircle2, AlertTriangle, User 
} from 'lucide-react';
import { UserProfile } from '../../services/userService';

export const EmployeeDashboard = ({ 
  user, 
  onClose 
}: { 
  user: UserProfile; 
  onClose: () => void 
}) => {
  const [activeTab, setActiveTab] = useState<'performance' | 'attendance' | 'commissions' | 'expenses' | 'activity'>('performance');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[2000] flex justify-end"
    >
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-slate-50 w-full max-w-4xl h-full shadow-2xl flex flex-col border-l border-slate-200"
      >
        {/* Header */}
        <div className="bg-white p-8 border-b border-slate-200">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-indigo-600/20">
                {(user.full_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{user.full_name}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600">
                    {user.role}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                    <CheckCircle2 size={12} /> Active Status
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'performance', label: 'Performance & Targets', icon: Target },
              { id: 'attendance', label: 'Attendance & Shifts', icon: Clock },
              { id: 'commissions', label: 'Commissions', icon: DollarSign },
              { id: 'expenses', label: 'Expenses', icon: Receipt },
              { id: 'activity', label: 'Activity Log', icon: Activity }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-slate-900 text-neon shadow-xl shadow-slate-900/10' 
                    : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* PERFORMANCE TAB */}
          {activeTab === 'performance' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 text-slate-500 mb-4">
                    <Target size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Monthly Target</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">₹5,00,000</div>
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                    <div className="bg-indigo-600 h-full w-[78%]" />
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 mt-2 text-right">78% Achieved</div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 text-slate-500 mb-4">
                    <TrendingUp size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Revenue Generated</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">₹3,90,000</div>
                  <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2">
                    <TrendingUp size={12} /> +12% vs last month
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 text-slate-500 mb-4">
                    <Award size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Conversion Rate</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">24.5%</div>
                  <div className="text-[10px] font-bold text-slate-500 mt-2">Top 10% in company</div>
                </div>
              </div>
            </div>
          )}

          {/* ATTENDANCE TAB */}
          {activeTab === 'attendance' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-3xl border border-slate-200 p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Shift Management</h3>
                  <button className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100">
                    Assign Shift
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                    <div key={day} className="flex flex-col gap-2">
                      <div className="text-[10px] font-black uppercase text-center text-slate-400">{day}</div>
                      <div className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 ${
                        i < 5 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'
                      }`}>
                        <div className="text-[10px] font-bold">{i < 5 ? '09:00 - 17:00' : 'Off'}</div>
                        {i < 5 && <CheckCircle2 size={12} className="text-emerald-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6">Recent Attendance Logs</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                          <Calendar size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900 uppercase">May {14 - i}, 2026</div>
                          <div className="text-[10px] font-bold text-slate-500">Duration: 8h 15m</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                        <div className="flex items-center gap-1 text-emerald-600"><CheckCircle2 size={12} /> In: 08:50 AM</div>
                        <div className="flex items-center gap-1 text-slate-600"><CheckCircle2 size={12} /> Out: 05:05 PM</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* COMMISSIONS TAB */}
          {activeTab === 'commissions' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-indigo-900 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-20 -mt-20" />
                <div className="relative z-10 flex justify-between items-end">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">Pending Commission Payout</div>
                    <div className="text-5xl font-black text-white">₹12,450</div>
                  </div>
                  <button className="px-6 py-3 bg-neon text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors">
                    Approve Payout
                  </button>
                </div>
               </div>

               <div className="bg-white rounded-3xl border border-slate-200 p-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6">Commission Structure</h3>
                <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                  <div className="flex items-center gap-3">
                    <DollarSign className="text-slate-400" size={18} />
                    <span className="text-xs font-black text-slate-700 uppercase">Standard Sales Tier</span>
                  </div>
                  <span className="text-sm font-black text-indigo-600">2.5% Flat Rate</span>
                </div>
               </div>
            </div>
          )}

          {/* EXPENSES TAB */}
          {activeTab === 'expenses' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Expense Claims</h3>
                <button className="px-4 py-2 bg-slate-900 text-neon rounded-xl text-[10px] font-black uppercase tracking-widest">
                  + Log Expense
                </button>
              </div>
              <div className="space-y-4">
                  {[
                    { title: 'Client Lunch Meeting', amount: '₹1,250', status: 'Pending', date: 'May 12' },
                    { title: 'Travel Allowance (Fuel)', amount: '₹800', status: 'Approved', date: 'May 10' }
                  ].map((exp, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <div className="text-xs font-black text-slate-900 uppercase">{exp.title}</div>
                        <div className="text-[10px] font-bold text-slate-500">{exp.date}</div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-sm font-black text-slate-900">{exp.amount}</div>
                        <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                          exp.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {exp.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          )}

          {/* ACTIVITY LOG TAB */}
          {activeTab === 'activity' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-8">Daily Activity Log</h3>
              <div className="relative border-l-2 border-slate-100 ml-4 space-y-8 pb-4">
                {[
                  { time: '14:30', title: 'Created Invoice #INV-2026', desc: 'Billed ₹45,000 to Alpha Corp', icon: Receipt },
                  { time: '11:15', title: 'Added New Lead', desc: 'Met with regional distributor', icon: User },
                  { time: '09:00', title: 'Clocked In', desc: 'Started shift via Mobile App', icon: Clock }
                ].map((log, i) => (
                  <div key={i} className="relative pl-8">
                    <div className="absolute -left-3 top-0 w-6 h-6 bg-white border-2 border-indigo-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                    </div>
                    <div className="flex gap-4">
                      <div className="text-[10px] font-black text-slate-400 mt-1">{log.time}</div>
                      <div>
                        <div className="text-xs font-black text-slate-900 uppercase">{log.title}</div>
                        <div className="text-[11px] font-medium text-slate-500 mt-1">{log.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </motion.div>
  );
};
