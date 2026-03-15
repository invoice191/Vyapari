import { useState } from "react";
import { C, auditLogsData } from "../../constants";
import { useBreakpoint, rv } from "../../hooks/useBreakpoint";
import { Card, SectionHeader } from "../common/UI";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function AuditLogs() {
  const bp = useBreakpoint();
  const [search, setSearch] = useState("");

  const filtered = auditLogsData.filter(l =>
    l.user.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.target.toLowerCase().includes(search.toLowerCase())
  );

  const activityData = [
    { day: "Mon", info: 18, warning: 4, critical: 0 },
    { day: "Tue", info: 22, warning: 6, critical: 1 },
    { day: "Wed", info: 15, warning: 3, critical: 0 },
    { day: "Thu", info: 30, warning: 8, critical: 2 },
    { day: "Fri", info: 25, warning: 5, critical: 1 },
    { day: "Sat", info: 12, warning: 2, critical: 0 },
    { day: "Sun", info: 8, warning: 1, critical: 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="brutal-card bg-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b-4 border-ink pb-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight uppercase leading-none">Audit_Activity_Timeline</h2>
            <p className="text-[10px] font-bold text-ink/40 uppercase tracking-widest mt-2">Event volume distribution by temporal cycle</p>
          </div>
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fontWeight: 900 }} axisLine={{ stroke: '#000', strokeWidth: 2 }} />
              <YAxis tick={{ fontSize: 10, fontWeight: 900 }} axisLine={{ stroke: '#000', strokeWidth: 2 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: 'none', color: '#fff', borderRadius: '0px' }}
                itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
              />
              <Legend iconType="rect" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }} />
              <Bar dataKey="info" name="Info" stackId="a" fill="#3B82F6" />
              <Bar dataKey="warning" name="Warning" stackId="a" fill="#F59E0B" />
              <Bar dataKey="critical" name="Critical" stackId="a" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="brutal-card bg-white">
        <div className="relative mb-8">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40">🔍</span>
          <input 
            placeholder="SEARCH_SYSTEM_LOGS_BY_USER_ACTION_OR_TARGET..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-ink/5 border-2 border-ink p-3 pl-12 font-black text-xs uppercase tracking-widest outline-none focus:bg-neon/10 transition-colors"
          />
        </div>
        <div className="overflow-x-auto border-2 border-ink">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr className="bg-ink text-white">
                {["Event ID", "User", "Action", "Module", "Severity", "Timestamp"].map(h => (
                  <th key={h} className="p-4 text-[10px] font-black uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => (
                <tr key={i} className="border-b border-ink/5 last:border-0 hover:bg-neon/5 transition-colors group">
                  <td className="p-4 text-xs font-black text-ink uppercase tracking-widest">{log.id}</td>
                  <td className="p-4 text-xs font-bold uppercase tracking-tight">{log.user}</td>
                  <td className="p-4 text-xs font-black uppercase tracking-tight">{log.action}</td>
                  <td className="p-4 text-[10px] font-black text-ink/40 uppercase tracking-widest">{log.module}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 border-2 text-[8px] font-black uppercase tracking-widest ${
                      log.severity === "Critical" ? 'border-red-500 text-red-500 bg-red-50' : 'border-ink/20 text-ink/40 bg-ink/5'
                    }`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="p-4 text-[10px] font-black text-ink/40 uppercase tracking-widest">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
