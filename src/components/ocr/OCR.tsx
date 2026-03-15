import { useState, useEffect } from "react";
import { C, ocrQueue } from "../../constants";
import { useBreakpoint, rv } from "../../hooks/useBreakpoint";
import { Card, SectionHeader, Badge, OrangeBtn } from "../common/UI";
import { motion, AnimatePresence } from "motion/react";

export default function OCR() {
  const bp = useBreakpoint();
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [queue, setQueue] = useState(ocrQueue);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setQueue(prev => prev.map(item => {
        if (item.status === "Processing") {
          if (Math.random() > 0.7) {
            return { ...item, status: "Completed", vendor: "Auto-Detected Vendor", amount: "₹" + (Math.random() * 5000 + 500).toFixed(0) };
          }
        }
        return item;
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      const newItem = {
        id: Date.now(),
        name: "invoice_" + Math.floor(Math.random() * 1000) + ".pdf",
        status: "Processing",
        confidence: 0,
        vendor: "Extracting...",
        amount: "—"
      };
      setQueue([newItem, ...queue]);
      setIsUploading(false);
    }, 1500);
  };

  const extractedData = {
    vendor: "TechCorp Distributors",
    invoice_no: "TC-2024-0892",
    date: "January 15, 2024",
    items: [
      { desc: "iPhone 15 Pro (128GB)", qty: 5, unit: 28000, tax: 8400, total: 148400 },
      { desc: "Apple Watch S9", qty: 3, unit: 42000, tax: 7560, total: 133560 },
      { desc: "AirPods Pro 2nd Gen", qty: 10, unit: 18000, tax: 10800, total: 190800 },
    ],
    subtotal: 444200,
    gst: 26760,
    total: 470960,
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Processed", value: "1,247", icon: "📄", color: '#FF6B35' },
          { label: "Avg Confidence", value: "96.2%", icon: "🎯", color: '#10B981' },
          { label: "Pending Review", value: "8", icon: "⏳", color: '#F59E0B' },
          { label: "Failed", value: "3", icon: "❌", color: '#EF4444' },
        ].map(s => (
          <div key={s.label} className="brutal-card bg-white flex justify-between items-center group hover:bg-ink hover:text-white transition-colors">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-ink/40 group-hover:text-white/40 mb-2">{s.label}</div>
              <div className="text-3xl font-black tracking-tighter" style={{ color: s.color }}>{s.value}</div>
            </div>
            <span className="text-3xl opacity-40 group-hover:opacity-100 transition-opacity">{s.icon}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="brutal-card bg-white/50 backdrop-blur-xl">
            <motion.div
              onDragEnter={() => setDragging(true)}
              onDragLeave={() => setDragging(false)}
              onDrop={() => setDragging(false)}
              whileHover={{ scale: 1.01 }}
              className={`
                border-4 border-dashed p-12 text-center transition-all cursor-pointer
                ${dragging ? 'border-neon bg-neon/10' : 'border-ink/10 bg-white/30 hover:border-ink/30'}
              `}
            >
              <div className="text-6xl mb-6">📁</div>
              <h3 className="text-xl font-black tracking-tight mb-2 uppercase">Drop_Invoices_Here</h3>
              <p className="text-xs font-bold text-ink/40 uppercase tracking-widest mb-8">Support for PDF, JPG, PNG (Max 10MB)</p>
              <button 
                onClick={handleUpload} 
                disabled={isUploading}
                className="brutal-btn"
              >
                {isUploading ? "PROCESSING_NEURAL_SCAN..." : "SELECT_FILES_FOR_EXTRACTION"}
              </button>
            </motion.div>
          </div>

          <div className="brutal-card bg-white">
            <div className="flex items-center justify-between mb-6 border-b border-ink/10 pb-4">
              <h3 className="text-lg font-black tracking-tight uppercase">Processing_Queue</h3>
              <div className="px-3 py-1 bg-ink text-white text-[10px] font-black uppercase tracking-widest">Active_Scan</div>
            </div>
            <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
              <AnimatePresence initial={false}>
                {queue.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onClick={() => setSelected(item)}
                    className={`
                      flex items-center gap-4 p-4 border-2 transition-all cursor-pointer
                      ${selected?.id === item.id ? 'border-ink bg-neon/5 translate-x-1' : 'border-transparent hover:border-ink/10'}
                    `}
                  >
                    <span className="text-2xl">
                      {item.status === "Completed" ? "✅" : item.status === "Processing" ? "⚙️" : item.status === "Failed" ? "❌" : "⏳"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-xs uppercase tracking-widest truncate">{item.name}</div>
                      <div className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">{item.vendor}</div>
                    </div>
                    <div className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border ${
                      item.status === "Completed" ? 'border-green-500 text-green-500' : 
                      item.status === "Processing" ? 'border-neon text-neon' : 'border-ink/20 text-ink/40'
                    }`}>
                      {item.status}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="brutal-card bg-white">
          <div className="flex items-center justify-between mb-8 border-b border-ink/10 pb-4">
            <h3 className="text-lg font-black tracking-tight uppercase">Extracted_Data_Preview</h3>
            <div className="flex gap-2">
              <button className="brutal-btn !py-1.5 !px-3 text-[10px] !bg-white !text-ink">EDIT</button>
              <button className="brutal-btn !py-1.5 !px-3 text-[10px]">APPROVE</button>
            </div>
          </div>

          <div className="bg-ink text-white p-6 mb-8 border-l-4 border-neon">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { label: "Vendor", value: extractedData.vendor },
                { label: "Invoice No", value: extractedData.invoice_no },
                { label: "Date", value: extractedData.date },
              ].map(f => (
                <div key={f.label}>
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{f.label}</div>
                  <div className="text-sm font-black tracking-tight">{f.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-2 border-ink">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-ink/5 border-b-2 border-ink">
                  {["Description", "Qty", "Total"].map(h => (
                    <th key={h} className={`p-3 text-[10px] font-black uppercase tracking-widest ${h === "Description" ? "" : "text-right"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {extractedData.items.map((item, i) => (
                  <tr key={i} className="border-b border-ink/5 last:border-0 hover:bg-neon/5 transition-colors">
                    <td className="p-3 text-xs font-bold uppercase tracking-tight">{item.desc}</td>
                    <td className="p-3 text-xs font-black text-right">{item.qty}</td>
                    <td className="p-3 text-xs font-black text-right data-value">₹{item.total.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-ink text-white">
                <tr>
                  <td colSpan={2} className="p-3 text-[10px] font-black uppercase tracking-widest">Total_Payable</td>
                  <td className="p-3 text-sm font-black text-right data-value tracking-tighter">₹{extractedData.total.toLocaleString("en-IN")}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
