import React, { useState, useEffect } from 'react';
import { Shield, Upload, CheckCircle, AlertTriangle, HelpCircle, ArrowRight, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { itcShieldService } from '../../services/itcShieldService';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

const ITCShield: React.FC = () => {
  const { business } = useAuth();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState({
    matched: 0,
    mismatched: 0,
    missingInBooks: 0,
    missingInPortal: 0,
    itcAtRisk: 0
  });

  useEffect(() => {
    if (business?.id) {
      fetchRecords();
    }
  }, [business?.id]);

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('gstr2b_records')
      .select('*')
      .eq('business_id', business?.id)
      .order('created_at', { ascending: false });

    if (data) {
      setRecords(data);
      calculateStats(data);
    }
  };

  const calculateStats = (data: any[]) => {
    const s = {
      matched: data.filter(r => r.reconciliation_status === 'matched').length,
      mismatched: data.filter(r => r.reconciliation_status === 'mismatched').length,
      missingInBooks: data.filter(r => r.reconciliation_status === 'missing_in_books').length,
      missingInPortal: data.filter(r => r.reconciliation_status === 'missing_in_portal').length,
      itcAtRisk: data.filter(r => r.reconciliation_status !== 'matched').reduce((acc, r) => acc + (Number(r.igst) + Number(r.cgst) + Number(r.sgst)), 0)
    };
    setStats(s);
  };

  const handleRunRecon = async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const res = await itcShieldService.reconcile(business.id, 'MAY-2026');
      toast.success(`Reconciliation Complete! ${res.matched} invoices matched.`);
      fetchRecords();
    } catch (err: any) {
      toast.error('Reconciliation Failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent">
            ITC Shield: GSTR-2B Reconciliation
          </h1>
          <p className="text-slate-400">Autonomous Input Tax Credit Protection Engine</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-800 text-white font-medium text-sm flex items-center transition-colors">
            <Upload className="w-4 h-4 mr-2" /> Import JSON
          </button>
          <button 
            onClick={handleRunRecon} 
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-lg shadow-indigo-500/20 flex items-center transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Run Neural Recon
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 backdrop-blur-xl rounded-2xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-400">ITC At Risk</p>
              <h3 className="text-2xl font-bold text-red-400 mt-1">₹{stats.itcAtRisk.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 backdrop-blur-xl rounded-2xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-400">Perfect Match</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{stats.matched}</h3>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 backdrop-blur-xl rounded-2xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-400">Mismatched</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">{stats.mismatched}</h3>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 backdrop-blur-xl rounded-2xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-400">Missing in Books</p>
              <h3 className="text-2xl font-bold text-blue-400 mt-1">{stats.missingInBooks}</h3>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <HelpCircle className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 backdrop-blur-xl rounded-2xl overflow-hidden">
        <div className="border-b border-slate-800 bg-slate-900/80 p-6">
          <h3 className="text-lg font-bold text-white">Detailed Reconciliation Analysis</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Vendor / GSTIN</th>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Value</th>
                  <th className="px-6 py-4">Tax (ITC)</th>
                  <th className="px-6 py-4 text-right">Match Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No GSTR-2B data imported yet. Upload a JSON to start.
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.reconciliation_status === 'matched' ? 'bg-emerald-500/10 text-emerald-400' :
                          record.reconciliation_status === 'mismatched' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-blue-500/10 text-blue-400'
                        }`}>
                          {record.reconciliation_status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-200">{record.vendor_name || 'Unknown Vendor'}</div>
                        <div className="text-xs text-slate-500">{record.vendor_gstin}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-mono text-sm">{record.invoice_number}</td>
                      <td className="px-6 py-4 text-slate-300">₹{record.invoice_value}</td>
                      <td className="px-6 py-4 text-slate-300 font-medium">₹{(Number(record.igst) + Number(record.cgst) + Number(record.sgst)).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-slate-500">{Math.round((record.match_score || 0) * 100)}%</span>
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${record.match_score > 0.9 ? 'bg-emerald-500' : record.match_score > 0.6 ? 'bg-amber-500' : 'bg-red-500'}`} 
                              style={{ width: `${(record.match_score || 0) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ITCShield;
