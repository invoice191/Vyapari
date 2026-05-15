import React from 'react';
import { Receipt, FileText, CheckCircle2, XCircle, Clock, Plus } from 'lucide-react';

const ExpenseManager: React.FC = () => {
  const expenses = [
    { id: 'EXP-001', member: 'Saurabh Prajwal', type: 'Travel', amount: '₹1,250', date: 'May 14, 2024', status: 'approved' },
    { id: 'EXP-002', member: 'Aditi Sharma', type: 'Office Supplies', amount: '₹450', date: 'May 12, 2024', status: 'pending' },
    { id: 'EXP-003', member: 'Rahul Verma', type: 'Fuel', amount: '₹2,800', date: 'May 10, 2024', status: 'rejected' },
    { id: 'EXP-004', member: 'Priya Singh', type: 'Lunch', amount: '₹1,200', date: 'May 08, 2024', status: 'approved' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Expense Management</h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Review and approve team reimbursements</p>
        </div>
        <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-3 font-bold text-sm uppercase tracking-wider shadow-xl shadow-slate-900/10">
          <Plus size={18} />
          Bulk Approve
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Pending Approval', value: '₹14,500', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Approved this Month', value: '₹1,24,200', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Policy Violations', value: '2', icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Expense ID</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Member</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((exp, idx) => (
                <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-4">
                    <span className="font-bold text-slate-500 text-xs">#{exp.id}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className="font-bold text-slate-900">{exp.member}</span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                      <FileText size={14} className="text-slate-400" />
                      {exp.type}
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className="font-black text-slate-900">{exp.amount}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      exp.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      exp.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {exp.status}
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

export default ExpenseManager;
