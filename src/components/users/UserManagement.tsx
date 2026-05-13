import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, Search, UserPlus, Shield, ShieldCheck, 
  UserX, Edit3, MoreHorizontal, Mail, Phone, 
  MapPin, CheckCircle2, AlertCircle, Trash2, 
  Key, Clock, ShieldAlert, X
} from "lucide-react";
import { userService, UserProfile } from "../../services/userService";
import { auditService } from "../../services/auditService";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

const ROLE_MAP: Record<string, { label: string, color: string, icon: any }> = {
  "owner": { label: "System Owner", color: "text-indigo-600 bg-indigo-50 border-indigo-100", icon: ShieldCheck },
  "banker": { label: "Banker / Auditor", color: "text-emerald-600 bg-emerald-50 border-emerald-100", icon: Shield },
  "employee": { label: "Operational Staff", color: "text-amber-600 bg-amber-50 border-amber-100", icon: Users },
  "salesperson": { label: "Field Sales", color: "text-blue-600 bg-blue-50 border-blue-100", icon: UserPlus },
};

export default function UserManagement() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<UserProfile | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<UserProfile | null>(null);

  const [formData, setFormData] = useState({ name: "", email: "", role: "employee" });
  const [savingUser, setSavingUser] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const loadUsers = useCallback(async () => {
    if (profile?.business_id) {
      setLoading(true);
      try {
        const data = await userService.getUsersByBusiness(profile.business_id);
        setUsers(data || []);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    }
  }, [profile?.business_id]);

  useEffect(() => {
    loadUsers();
    if (!profile?.business_id) return;
    const channel = supabase.channel("public:profiles")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `business_id=eq.${profile.business_id}` }, () => loadUsers())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.business_id, loadUsers]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.business_id || !formData.name || !formData.email) return;

    setSavingUser(true);
    setSaveStatus('saving');
    try {
      await userService.createUser({
        full_name: formData.name,
        email: formData.email,
        role: formData.role,
        business_id: profile.business_id,
      });

      await auditService.logAction({
        business_id: profile.business_id,
        user_id: profile.id,
        action: 'USER_CREATED',
        module: 'Settings',
        metadata: { ...formData }
      });

      setSaveStatus('success');
      setTimeout(() => {
        setFormData({ name: "", email: "", role: "employee" });
        setShowAddModal(false);
        setSavingUser(false);
        setSaveStatus('idle');
        loadUsers();
      }, 1500);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
      setTimeout(() => setSavingUser(false), 1500);
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      const before = users.find(u => u.id === userId);
      await userService.updateRole(userId, role, profile?.business_id || '');
      
      await auditService.logAction({
        business_id: profile?.business_id || '',
        user_id: profile?.id || '',
        action: 'USER_ROLE_UPDATED',
        module: 'Settings',
        metadata: { user_id: userId, before: before?.role, after: role }
      });

      setShowEditModal(null);
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = users.filter(u => {
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    const matchesSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) || 
                         u.email?.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 text-neon rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
              <ShieldCheck size={28} />
            </div>
            Team <span className="text-indigo-600 italic">Access</span>
          </h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-2 ml-16">
            Manage roles and cryptographic clearance levels
          </p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neon hover:text-slate-900 transition-all shadow-xl shadow-indigo-500/20"
        >
          <UserPlus size={18} /> Provision New Staff
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100">
        <div className="flex flex-col lg:flex-row gap-6 mb-10">
          <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input 
              placeholder="SEARCH STAFF BY NAME OR IDENTITY..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-50 p-5 pl-16 rounded-[2rem] font-black text-xs uppercase tracking-widest outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
            />
          </div>
          
          <div className="flex gap-2 p-1.5 bg-slate-50 rounded-[2.2rem] border border-slate-100">
            {["All", "owner", "banker", "employee", "salesperson"].map(r => (
              <button 
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  roleFilter === r ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-500/10' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <AnimatePresence>
            {filtered.map((u) => {
              const RoleIcon = ROLE_MAP[u.role || 'employee']?.icon || Users;
              return (
                <motion.div 
                  layout
                  key={u.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 hover:bg-white hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setShowEditModal(u)} className="p-3 bg-slate-100 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                      <Edit3 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-slate-900/20 group-hover:bg-indigo-600 transition-colors">
                      {(u.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{u.full_name}</h3>
                      <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                        <Mail size={12} /> {u.email || 'No email linked'}
                      </div>
                    </div>
                  </div>

                  <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${ROLE_MAP[u.role || 'employee']?.color || 'bg-slate-100'} mb-8`}>
                    <RoleIcon size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {ROLE_MAP[u.role || 'employee']?.label || 'Unknown Role'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/50 p-4 rounded-2xl border border-slate-200/50">
                      <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${u.status === 'Suspended' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        <span className="text-[10px] font-black uppercase text-slate-900">{u.status || 'Active'}</span>
                      </div>
                    </div>
                    <div className="bg-white/50 p-4 rounded-2xl border border-slate-200/50">
                      <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned</div>
                      <span className="text-[10px] font-black uppercase text-slate-900 truncate">Main Branch</span>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => userService.suspendUser(u.id, profile?.business_id || '', u.status).then(loadUsers)}
                      className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-amber-500 hover:text-amber-600 transition-all"
                    >
                      {u.status === 'Suspended' ? 'Unsuspend' : 'Suspend'}
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(u)}
                      className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all border border-rose-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[1000] flex items-start justify-center overflow-y-auto p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[3rem] p-12 shadow-2xl relative overflow-hidden my-auto"
            >
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <UserPlus size={40} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Provision <span className="text-indigo-600">Staff</span></h2>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Initialize new credentials on the neural grid</p>
              </div>

              <form onSubmit={handleAddUser} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Legal Full Name</label>
                  <input 
                    required 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="ENTER NAME..."
                    className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-2xl font-black text-sm uppercase focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Secure Email Identity</label>
                  <input 
                    required 
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="STAFF@ENTERPRISE.COM..."
                    className="w-full bg-slate-50 border-2 border-slate-50 p-5 rounded-2xl font-black text-sm uppercase focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Clearance Level</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.keys(ROLE_MAP).map(r => (
                      <button 
                        key={r}
                        type="button"
                        onClick={() => setFormData({...formData, role: r})}
                        className={`p-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                          formData.role === r ? 'bg-slate-900 text-neon border-slate-900 shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-5 border-2 border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                  >
                    Abort
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neon hover:text-slate-900 transition-all shadow-xl shadow-indigo-500/20"
                  >
                    Deploy Identity
                  </button>
                </div>
              </form>

              {/* Premium Saving Animation Overlay */}
              <AnimatePresence>
                {savingUser && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-[1300] flex items-center justify-center p-6"
                  >
                    <motion.div
                      initial={{ scale: 0.9, y: 15 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 15 }}
                      className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-6"
                    >
                      <div className="relative flex items-center justify-center">
                        {saveStatus === 'success' ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.2, 1] }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20"
                          >
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <motion.path
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.4, delay: 0.2 }}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </motion.div>
                        ) : saveStatus === 'error' ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20"
                          >
                            <X className="text-white" size={32} />
                          </motion.div>
                        ) : (
                          <>
                            <motion.div
                              animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
                              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                              className="absolute w-20 h-20 bg-indigo-500/20 rounded-full"
                            />
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                              className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full relative z-10 shadow-md"
                            />
                          </>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">
                          {saveStatus === 'success' ? 'Identity Deployed!' : saveStatus === 'error' ? 'Failed to Provision' : 'Deploying Identity'}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                          {saveStatus === 'success' 
                            ? `Staff member initialized on the grid!` 
                            : saveStatus === 'error'
                            ? `Please check your inputs`
                            : `Provisioning credentials...`}
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Role Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[1000] flex items-start justify-center overflow-y-auto p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[3rem] p-12 shadow-2xl relative my-auto"
            >
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">Elevate <span className="text-indigo-600">Permissions</span></h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase mb-8">User: {showEditModal.full_name}</p>
              
              <div className="grid grid-cols-2 gap-4">
                {Object.keys(ROLE_MAP).map(role => (
                  <button
                    key={role}
                    onClick={() => handleUpdateRole(showEditModal.id, role)}
                    className={`p-6 border-2 rounded-[1.5rem] flex flex-col items-center gap-3 transition-all ${
                      showEditModal.role === role ? 'bg-slate-900 text-neon border-slate-900 shadow-2xl shadow-indigo-500/20' : 'bg-slate-50 border-transparent hover:border-slate-200'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${showEditModal.role === role ? 'bg-white/10' : 'bg-white shadow-sm'}`}>
                      {(() => {
                        const Icon = ROLE_MAP[role].icon;
                        return Icon ? <Icon size={24} /> : null;
                      })()}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{role}</span>
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setShowEditModal(null)}
                className="mt-10 w-full py-5 border-2 border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
              >
                Cancel Re-assignment
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[1000] flex items-start justify-center overflow-y-auto p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative border-4 border-rose-500/20 text-center my-auto"
            >
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">Revoke <span className="text-rose-500">Access</span></h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase mb-10 leading-relaxed">
                Permanently terminate cryptographic link for <br/> <span className="text-slate-900 font-black">{showDeleteConfirm.full_name}</span>?
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-5 bg-slate-50 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    userService.deleteUser(showDeleteConfirm.id, profile?.business_id || '').then(() => {
                      auditService.logAction({
                        business_id: profile?.business_id || '',
                        user_id: profile?.id || '',
                        action: 'USER_DELETED',
                        module: 'Settings',
                        metadata: { user_id: showDeleteConfirm.id, name: showDeleteConfirm.full_name }
                      });
                      setShowDeleteConfirm(null);
                      loadUsers();
                    });
                  }}
                  className="flex-1 py-5 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20"
                >
                  Terminate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
