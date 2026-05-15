import React from 'react';
import { Clock, Calendar, MapPin, UserCheck, AlertTriangle } from 'lucide-react';

const AttendanceShifts: React.FC = () => {
  const shifts = [
    { name: 'Saurabh Prajwal', time: '09:00 - 18:00', status: 'present', location: 'Main Office' },
    { name: 'Aditi Sharma', time: '10:00 - 19:00', status: 'present', location: 'Remote' },
    { name: 'Rahul Verma', time: '09:00 - 18:00', status: 'late', location: 'Warehouse' },
    { name: 'Priya Singh', time: '09:00 - 18:00', status: 'on-leave', location: '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Present Today', value: '18/22', icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'On Leave', value: '4', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Late Arrivals', value: '2', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Avg Shift', value: '8.5h', icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
              <stat.icon size={24} />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
              <div className="text-xl font-black text-slate-900">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Shift Live Monitor</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Real-time attendance & geo-tracking</p>
          </div>
          <button className="px-6 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">
            Configure Shifts
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Member</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Hours</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shifts.map((shift, idx) => (
                <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600 text-xs uppercase">
                        {shift.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-bold text-slate-900">{shift.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                      <Clock size={14} className="text-slate-400" />
                      {shift.time}
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                      <MapPin size={14} className="text-slate-400" />
                      {shift.location}
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      shift.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                      shift.status === 'late' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {shift.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceShifts;
