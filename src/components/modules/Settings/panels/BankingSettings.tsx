import React, { useState } from 'react';
import { Landmark, Plus, Trash2, Check, Shield, CreditCard, Building2, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast } from '../../../common/Toast';

export const BankingSettings = ({ data, onChange }: { data: any; onChange: (key: string, val: any) => void }) => {
  const { toast } = useToast();

  const settings = data.settings || {};
  const bankAccounts = settings.bankAccounts || [
    {
      id: "acc_1",
      bankName: "HDFC Bank",
      accountHolder: "Vyapari Enterprise Pvt Ltd",
      accountNumber: "•••• •••• 5678",
      ifscCode: "HDFC0000123",
      upiId: "vyapari@okhdfcbank",
      isPrimary: true,
      accountType: "Current Account"
    },
    {
      id: "acc_2",
      bankName: "ICICI Bank",
      accountHolder: "Vyapari Enterprise Pvt Ltd",
      accountNumber: "•••• •••• 9012",
      ifscCode: "ICIC0000456",
      upiId: "vyapari@okicici",
      isPrimary: false,
      accountType: "Savings Account"
    }
  ];

  const [newBank, setNewBank] = useState({
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    accountType: "Current Account"
  });

  const handleSetPrimaryBank = (accId: string) => {
    const updatedAccounts = bankAccounts.map((acc: any) => {
      if (acc.id === accId) {
        return { ...acc, isPrimary: true };
      }
      return { ...acc, isPrimary: false };
    });
    
    // Also find the new primary UPI ID and sync it to the business settings upiId
    const primaryAcc = updatedAccounts.find((acc: any) => acc.isPrimary);
    const newUpiId = primaryAcc ? primaryAcc.upiId : "";

    onChange('settings', {
      ...settings,
      bankAccounts: updatedAccounts,
      upiId: newUpiId
    });
    
    toast("Primary bank account updated and routing synchronized.", "success");
  };

  const handleAddBank = () => {
    if (!newBank.bankName || !newBank.accountNumber || !newBank.ifscCode) {
      toast("Please fill in Bank Name, Account Number, and IFSC Code.", "warning");
      return;
    }

    const cleanNumber = newBank.accountNumber.replace(/\s+/g, '');
    const obscured = cleanNumber.length > 4 
      ? `•••• •••• ${cleanNumber.slice(-4)}` 
      : cleanNumber;

    const newAcc = {
      id: `acc_${Date.now()}`,
      bankName: newBank.bankName,
      accountHolder: newBank.accountHolder || data.name || "Vyapari Enterprise",
      accountNumber: obscured,
      ifscCode: newBank.ifscCode.toUpperCase(),
      upiId: newBank.upiId || `${newBank.bankName.toLowerCase().replace(/\s+/g, '')}@upi`,
      isPrimary: bankAccounts.length === 0,
      accountType: newBank.accountType
    };

    const updatedAccounts = [...bankAccounts, newAcc];
    const newUpiId = newAcc.isPrimary ? newAcc.upiId : (settings.upiId || "");

    onChange('settings', {
      ...settings,
      bankAccounts: updatedAccounts,
      upiId: newUpiId
    });

    setNewBank({
      bankName: "",
      accountHolder: "",
      accountNumber: "",
      ifscCode: "",
      upiId: "",
      accountType: "Current Account"
    });

    toast("Bank account linked successfully.", "success");
  };

  const handleRemoveBank = (accId: string) => {
    const accToRemove = bankAccounts.find((acc: any) => acc.id === accId);
    if (!accToRemove) return;

    if (accToRemove.isPrimary && bankAccounts.length > 1) {
      toast("Set another account as active before removing this one.", "warning");
      return;
    }

    const updatedAccounts = bankAccounts.filter((acc: any) => acc.id !== accId);
    let newUpiId = settings.upiId || "";

    if (accToRemove.isPrimary && updatedAccounts.length > 0) {
      updatedAccounts[0].isPrimary = true;
      newUpiId = updatedAccounts[0].upiId;
    } else if (updatedAccounts.length === 0) {
      newUpiId = "";
    }

    onChange('settings', {
      ...settings,
      bankAccounts: updatedAccounts,
      upiId: newUpiId
    });

    toast("Bank account removed.", "info");
  };

  return (
    <div className="space-y-12">
      {/* Tab Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
          <Landmark size={20} />
        </div>
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight text-white font-display">Settlement Accounts</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Manage connected corporate banking links and instant cash routes</p>
        </div>
      </div>

      {/* Connected Accounts List */}
      <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8">
        <h4 className="text-xs font-black text-white uppercase tracking-wider mb-6 font-display">Connected Commercial Links</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {bankAccounts.map((acc: any) => (
            <motion.div
              key={acc.id}
              className={`relative rounded-[2rem] p-6 overflow-hidden shadow-xl flex flex-col justify-between min-h-[200px] transition-all border ${
                acc.isPrimary 
                  ? 'bg-gradient-to-br from-emerald-600/90 via-teal-800/90 to-slate-900/95 border-emerald-500/30 text-white shadow-emerald-950/20' 
                  : 'bg-[#182030] border-white/5 text-slate-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <Landmark className={acc.isPrimary ? 'text-neon animate-pulse' : 'text-slate-400'} size={20} />
                    <span className="font-black text-sm uppercase tracking-tight text-white">{acc.bankName}</span>
                  </div>
                  <span className="text-[8px] font-bold text-white/50 uppercase tracking-widest block mt-0.5">{acc.accountType}</span>
                </div>
                {acc.isPrimary && (
                  <span className="px-3 py-1 rounded-full bg-neon/20 border border-neon/30 text-neon font-black text-[8px] uppercase tracking-[0.2em] shadow-lg shadow-neon/10 animate-pulse">
                    ACTIVE ROUTING
                  </span>
                )}
              </div>

              <div className="my-5 space-y-1">
                <div className="text-lg font-mono font-bold tracking-[0.15em] text-white">
                  {acc.accountNumber}
                </div>
                <div className="flex flex-wrap gap-x-4 text-[9px] font-bold uppercase tracking-wider text-white/60">
                  <div>IFSC: <span className="text-white">{acc.ifscCode}</span></div>
                  <div>UPI: <span className="text-white">{acc.upiId}</span></div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-white/5">
                <div>
                  <div className="text-[7px] font-bold text-white/40 uppercase tracking-wider">Account Holder</div>
                  <div className="text-[10px] font-black text-white uppercase tracking-wide">{acc.accountHolder}</div>
                </div>
                <div className="flex items-center gap-2">
                  {!acc.isPrimary && (
                    <button
                      onClick={() => handleSetPrimaryBank(acc.id)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-neon hover:text-slate-950 font-black text-[8px] uppercase tracking-wider text-white transition-all flex items-center gap-1"
                    >
                      <Check size={10} /> Activate
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveBank(acc.id)}
                    className="p-2 rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white transition-all"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add Account Form */}
      <div className="glass-card !bg-white/[0.02] !border-white/[0.05] !p-8">
        <h4 className="text-xs font-black text-white uppercase tracking-wider mb-6 font-display">Link Commercial Institution</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block pl-1">Bank Name</label>
            <div className="relative">
              <Building2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="e.g. HDFC Bank"
                value={newBank.bankName}
                onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                className="w-full bg-[#182030] border border-white/10 rounded-xl p-3.5 pl-10 text-white text-xs outline-none focus:border-neon transition-all font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block pl-1">Account Holder Legal Name</label>
            <div className="relative">
              <Building2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="e.g. Vyapari Enterprise"
                value={newBank.accountHolder}
                onChange={(e) => setNewBank({ ...newBank, accountHolder: e.target.value })}
                className="w-full bg-[#182030] border border-white/10 rounded-xl p-3.5 pl-10 text-white text-xs outline-none focus:border-neon transition-all font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block pl-1">Account Number</label>
            <div className="relative">
              <CreditCard size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="12 to 16 digit number"
                value={newBank.accountNumber}
                onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
                className="w-full bg-[#182030] border border-white/10 rounded-xl p-3.5 pl-10 text-white text-xs outline-none focus:border-neon transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block pl-1">IFSC Code</label>
            <div className="relative">
              <Shield size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="e.g. HDFC0000123"
                value={newBank.ifscCode}
                onChange={(e) => setNewBank({ ...newBank, ifscCode: e.target.value })}
                className="w-full bg-[#182030] border border-white/10 rounded-xl p-3.5 pl-10 text-white text-xs outline-none focus:border-neon transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block pl-1">Instant UPI VPA Target</label>
            <div className="relative">
              <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="e.g. merchant@upi"
                value={newBank.upiId}
                onChange={(e) => setNewBank({ ...newBank, upiId: e.target.value })}
                className="w-full bg-[#182030] border border-white/10 rounded-xl p-3.5 pl-10 text-white text-xs outline-none focus:border-neon transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block pl-1">Account Classification</label>
            <select
              value={newBank.accountType}
              onChange={(e) => setNewBank({ ...newBank, accountType: e.target.value })}
              className="w-full bg-[#182030] border border-white/10 rounded-xl p-3.5 text-white text-xs outline-none focus:border-neon transition-all font-bold appearance-none px-4"
            >
              <option value="Current Account">CURRENT ACCOUNT (COMMERCIAL)</option>
              <option value="Savings Account">SAVINGS ACCOUNT (RETAIL)</option>
              <option value="Overdraft Account">OVERDRAFT ACCOUNT (OD)</option>
            </select>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
          <button
            onClick={handleAddBank}
            className="px-6 py-3.5 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-neon hover:text-slate-950 transition-all flex items-center gap-2"
          >
            <Plus size={14} /> Link Account
          </button>
        </div>
      </div>
    </div>
  );
};
