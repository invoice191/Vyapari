import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Mail, 
  Shield, 
  Phone, 
  MapPin, 
  MoreVertical, 
  Plus,
  X,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../common/Toast';
import axios from 'axios';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  phone: string;
  employee_id: string;
  avatar_url: string;
}

const TeamOverview: React.FC = () => {
  const { profile } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [provisionedUser, setProvisionedUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'staff',
    phone: '',
    employee_id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    address: '',
    emergency_contact: ''
  });

  const fetchMembers = async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('business_id', profile.business_id);
    
    if (!error && data) setMembers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [profile?.business_id]);

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisioning(true);
    try {
      // Call our hardened backend endpoint
      const response = await axios.post('http://localhost:3000/api/provision-staff', {
        ...formData,
        business_id: profile.business_id
      }, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_API_AUTH_TOKEN || '4a8f9e0d1c2a3b4f5e6a7b8c9d0e1f2a'}`
        }
      });

      if (response.data.success) {
        setProvisionedUser({
          ...formData,
          password: response.data.password
        });
        fetchMembers();
        toast.success("Staff provisioned successfully");
      }
    } catch (err: any) {
      console.error("Provisioning failed:", err);
      toast.error(err.response?.data?.error || "Failed to provision staff");
    } finally {
      setProvisioning(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const deleteMember = async (id: string, email: string) => {
    if (email === profile?.email) {
      toast.error("Cannot delete your own account");
      return;
    }
    if (!window.confirm("Are you sure you want to remove this team member? This will disable their access immediately.")) return;

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      setMembers(members.filter(m => m.id !== id));
      toast.success("Member removed");
    } catch (err) {
      toast.error("Failed to remove member");
    }
  };

  return (
    <div className="space-y-8">
      {/* Search & Stats Bar */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm min-w-[300px]">
            <Users className="text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search team members..." 
              className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 w-full placeholder:text-slate-300"
            />
          </div>
          <div className="hidden lg:flex items-center gap-2">
            {['Owner', 'Manager', 'Staff'].map(role => (
              <button key={role} className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors">
                {role}s
              </button>
            ))}
          </div>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full md:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95"
        >
          <Plus size={20} />
          Add New Member
        </button>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-64 bg-white rounded-[2.5rem] animate-pulse" />)
        ) : members.map((member) => (
          <motion.div 
            layout
            key={member.id}
            className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => deleteMember(member.id, member.email)}
                className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="flex items-center gap-5 mb-8">
              <div className="w-16 h-16 bg-slate-100 rounded-[1.5rem] flex items-center justify-center border-2 border-white shadow-inner font-black text-2xl text-slate-400 overflow-hidden">
                {member.avatar_url ? <img src={member.avatar_url} alt="" className="w-full h-full object-cover" /> : member.full_name[0]}
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 leading-tight">{member.full_name}</h4>
                <div className={`mt-1 inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-[0.15em] ${
                  member.role === 'owner' ? 'bg-slate-900 text-white' : 
                  member.role === 'manager' ? 'bg-blue-100 text-blue-700' : 
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {member.role}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-500">
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <Mail size={14} />
                </div>
                <span className="text-xs font-bold truncate">{member.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <Shield size={14} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">{member.employee_id || 'NO-ID'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <Phone size={14} />
                </div>
                <span className="text-xs font-bold">{member.phone || 'No phone set'}</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white" />
                ))}
              </div>
              <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 flex items-center gap-1 transition-colors">
                View Profile <ChevronRight size={12} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Provisioning Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !provisioning && setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative z-10 border border-white/20"
            >
              {!provisionedUser ? (
                <div className="p-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Provision New Staff</h3>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Identity & Access Handshake</p>
                    </div>
                    <button onClick={() => setShowAddModal(false)} className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                      <X size={20} className="text-slate-400" />
                    </button>
                  </div>

                  <form onSubmit={handleProvision} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                        <input 
                          required
                          value={formData.full_name}
                          onChange={e => setFormData({...formData, full_name: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                          placeholder="e.g. John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                        <input 
                          required
                          type="email"
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                          placeholder="john@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Role</label>
                        <select 
                          value={formData.role}
                          onChange={e => setFormData({...formData, role: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none transition-all appearance-none"
                        >
                          <option value="staff">Staff Member</option>
                          <option value="manager">Operations Manager</option>
                          <option value="viewer">Auditor / Viewer</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Employee ID</label>
                        <input 
                          value={formData.employee_id}
                          onChange={e => setFormData({...formData, employee_id: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 px-5 py-4 rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="p-6 bg-slate-900 rounded-[2rem] text-white flex items-center justify-between mt-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                          <Shield size={20} className="text-amber-400" />
                        </div>
                        <div>
                          <div className="font-black text-sm uppercase tracking-tight">Zero-Trust Protocol</div>
                          <div className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Auto-password generation enabled</div>
                        </div>
                      </div>
                      <button 
                        disabled={provisioning}
                        className="bg-white text-slate-900 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {provisioning ? <Loader2 className="animate-spin" size={16} /> : 'Generate Identity'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-10 text-center">
                  <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-emerald-100 shadow-xl shadow-emerald-500/10">
                    <CheckCircle2 size={48} />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">Staff Provisioned</h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-10">
                    {provisionedUser.emailSent 
                      ? "Handshake complete. Credentials sent to member email." 
                      : "Handshake complete. Temporary credentials ready."}
                  </p>

                  <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 space-y-6 mb-10 max-w-sm mx-auto">
                    <div className="space-y-1">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username / Email</div>
                      <div className="font-black text-slate-900">{provisionedUser.email}</div>
                    </div>
                    <div className="space-y-2 relative">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Temporary Password</div>
                      <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 font-mono font-black text-slate-900 text-lg flex items-center justify-between group">
                        {provisionedUser.password}
                        <button onClick={() => copyToClipboard(provisionedUser.password)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 transition-colors">
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => {
                        setShowAddModal(false);
                        setProvisionedUser(null);
                        setFormData({
                          full_name: '',
                          email: '',
                          role: 'staff',
                          phone: '',
                          employee_id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
                          address: '',
                          emergency_contact: ''
                        });
                      }}
                      className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-900/20"
                    >
                      Done
                    </button>
                    {provisionedUser.simulated && (
                      <div className="px-4 py-2 bg-amber-50 rounded-xl text-[10px] font-bold text-amber-700 uppercase tracking-widest border border-amber-100">
                        Note: SMTP not configured. Email logged to server console.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Placeholder for ChevronRight since it was missing from imports
const ChevronRight = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;

export default TeamOverview;
