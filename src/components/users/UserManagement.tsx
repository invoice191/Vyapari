import { useState } from "react";
import { C, usersData } from "../../constants";
import { useBreakpoint, rv } from "../../hooks/useBreakpoint";
import { Card, OrangeBtn, SectionHeader } from "../common/UI";
import { motion, AnimatePresence } from "motion/react";

const ROLES_CONFIG: any = {
  "Super Admin": { color: "#6C5CE7", bg: "#F0EEFF" },
  "Admin": { color: C.orange, bg: C.peach },
  "Manager": { color: C.blue, bg: "#EEF4FF" },
  "Analyst": { color: C.green, bg: "#E8FDF5" },
  "Cashier": { color: C.mid, bg: C.gray100 },
};

export default function UserManagement() {
  const bp = useBreakpoint();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  const filtered = usersData.filter(u =>
    (roleFilter === "All" || u.role === roleFilter) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.includes(search))
  );

  const AvatarCircle = ({ initials, role, size = 40 }: any) => {
    return (
      <div 
        className="bg-ink text-white flex items-center justify-center font-black shadow-[4px_4px_0px_rgba(0,0,0,0.2)]"
        style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        {initials}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: "Total Users", value: usersData.length, icon: "👥", color: "text-blue-500" },
          { label: "Active", value: usersData.filter(u => u.status === "Active").length, icon: "🟢", color: "text-emerald-500" },
          { label: "Shops Covered", value: 3, icon: "🏪", color: "text-amber-500" },
        ].map(s => (
          <div key={s.label} className="brutal-card bg-white p-6 text-center group hover:bg-ink hover:text-white transition-colors">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className={`text-4xl font-black ${s.color} group-hover:text-white transition-colors`}>{s.value}</div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="brutal-card bg-white">
        <div className="flex flex-col lg:flex-row gap-6 mb-8 items-start lg:items-center justify-between">
          <div className="relative flex-1 w-full lg:max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40">🔍</span>
            <input 
              placeholder="SEARCH_USERS_BY_NAME_OR_EMAIL..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-ink/5 border-2 border-ink p-3 pl-12 font-black text-xs uppercase tracking-widest outline-none focus:bg-neon/10 transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {["All", "Admin", "Manager", "Analyst", "Cashier"].map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-4 py-2 border-2 border-ink font-black text-[10px] uppercase tracking-widest transition-all ${
                  roleFilter === r 
                    ? 'bg-ink text-white shadow-[4px_4px_0px_rgba(0,0,0,0.2)]' 
                    : 'bg-white text-ink hover:bg-ink/5'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button className="brutal-btn bg-neon text-ink px-8 py-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
            + ADD_NEW_USER
          </button>
        </div>

        <div className="overflow-x-auto border-2 border-ink">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr className="bg-ink text-white">
                {["User", "Role", "Assigned Shop", "Status", "Last Login"].map(h => (
                  <th key={h} className="p-4 text-[10px] font-black uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filtered.map((u, i) => (
                  <motion.tr 
                    key={u.email}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-ink/5 last:border-0 hover:bg-neon/5 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <AvatarCircle initials={u.avatar} role={u.role} />
                        <div>
                          <div className="font-black text-sm uppercase tracking-tight text-ink">{u.name}</div>
                          <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 border-2 border-ink/20 text-[8px] font-black uppercase tracking-widest bg-ink/5 text-ink/60">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-[10px] font-black text-ink/40 uppercase tracking-widest">{u.shop}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 border-2 text-[8px] font-black uppercase tracking-widest ${
                        u.status === "Active" ? 'border-emerald-500 text-emerald-500 bg-emerald-50' : 'border-ink/20 text-ink/40 bg-ink/5'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-[10px] font-black text-ink/40 uppercase tracking-widest">{u.lastLogin}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
