import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Target, 
  Clock, 
  DollarSign, 
  Receipt, 
  Activity,
  Plus,
  Search,
  Filter,
  Shield,
  ChevronRight,
  TrendingUp,
  Award,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from '../common/Toast';

// Sub-components (to be implemented)
import TeamOverview from './TeamOverview';
import PerformanceTargets from './PerformanceTargets';
import AttendanceShifts from './AttendanceShifts';
import CommissionsHub from './CommissionsHub';
import ExpenseManager from './ExpenseManager';
import ActivityFeed from './ActivityFeed';

type TabType = 'overview' | 'performance' | 'attendance' | 'commissions' | 'expenses' | 'activity';

const TeamHub: React.FC = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isAddingMember, setIsAddingMember] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Members', icon: Users, color: 'text-blue-500' },
    { id: 'performance', label: 'Performance', icon: Target, color: 'text-purple-500' },
    { id: 'attendance', label: 'Attendance', icon: Clock, color: 'text-emerald-500' },
    { id: 'commissions', label: 'Commissions', icon: DollarSign, color: 'text-amber-500' },
    { id: 'expenses', label: 'Expenses', icon: Receipt, color: 'text-rose-500' },
    { id: 'activity', label: 'Live Feed', icon: Activity, color: 'text-indigo-500' },
  ];

  return (
    <div className="h-full flex flex-col bg-[#f8fafc]">
      {/* Premium Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <Users className="text-white" size={18} />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">My Team</h1>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
              Enterprise Workforce Management & Intelligence
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Members</span>
              <span className="text-xl font-black text-slate-900">12</span>
            </div>
            <button 
              onClick={() => setIsAddingMember(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-slate-900/10 font-bold text-sm uppercase tracking-wider"
            >
              <Plus size={18} />
              Provision Staff
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto w-full mt-8">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-white' : tab.color} />
                  <span className={`text-sm font-black uppercase tracking-wider ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'overview' && <TeamOverview />}
              {activeTab === 'performance' && <PerformanceTargets />}
              {activeTab === 'attendance' && <AttendanceShifts />}
              {activeTab === 'commissions' && <CommissionsHub />}
              {activeTab === 'expenses' && <ExpenseManager />}
              {activeTab === 'activity' && <ActivityFeed />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TeamHub;
