import React from 'react';
import { motion } from 'motion/react';
import { X, FileDown, Link, QrCode, Mail, Check, Copy } from 'lucide-react';
import { Theme } from '../PresentationMode';

interface ShareModalProps {
  data: any;
  onClose: () => void;
  theme: Theme;
}

export default function ShareModal({ data, onClose, theme }: ShareModalProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://vyapari.ai/present/${data.simulation_id || 'test-token'}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bgColor = theme === 'dark' ? 'bg-[#0F172A]' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-slate-200';

  const shareOptions = [
    { icon: <FileDown />, title: 'Download PDF', desc: '10 slides as professional PDF', color: 'text-rose-500' },
    { icon: <Link />, title: 'Copy Link', desc: 'Anyone with link can view', color: 'text-indigo-500', onClick: handleCopy },
    { icon: <QrCode />, title: 'QR Code', desc: 'Scan to open on phone', color: 'text-emerald-500' },
    { icon: <Mail />, title: 'Email Report', desc: 'Send to client\'s email', color: 'text-amber-500' },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`relative w-full max-w-md ${bgColor} border ${borderColor} rounded-[2.5rem] p-10 shadow-2xl overflow-hidden my-auto`}
      >
        <div className="absolute top-0 right-0 p-8">
          <button onClick={onClose} className={`p-2 rounded-lg hover:bg-white/10 ${textColor}`}>
            <X size={20} />
          </button>
        </div>

        <h3 className={`text-xl font-black uppercase tracking-tight mb-2 ${textColor}`}>Share Presentation</h3>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-10">Export or share this strategic scan</p>

        <div className="space-y-4">
          {shareOptions.map((opt, i) => (
            <button
              key={i}
              onClick={opt.onClick}
              className={`w-full p-6 bg-white/5 border ${borderColor} rounded-3xl flex items-center gap-6 hover:bg-white/10 transition-all text-left group`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-xl ${opt.color} group-hover:scale-110 transition-transform`}>
                {opt.icon}
              </div>
              <div className="flex-1">
                <div className={`text-sm font-black uppercase tracking-tight ${textColor}`}>{opt.title}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{opt.desc}</div>
              </div>
              {opt.title === 'Copy Link' && (
                <div className={`text-indigo-500 transition-all ${copied ? 'opacity-100' : 'opacity-0'}`}>
                  <Check size={20} />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-10 pt-8 border-t border-white/5 text-center">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
            Encryption: 256-bit AES | Public access limited
          </p>
        </div>
      </motion.div>
    </div>
  );
}
