import { useState, useEffect } from "react";
import { C, ocrQueue } from "../../constants";
import { useBreakpoint, rv } from "../../hooks/useBreakpoint";
import { Card, SectionHeader, Badge, OrangeBtn } from "../common/UI";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../../supabase";

export default function OCR() {
  const bp = useBreakpoint();
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [queue, setQueue] = useState(ocrQueue);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedResult, setExtractedResult] = useState<any>(null);

  const handleUpload = async (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        
        const newItem = {
          id: Date.now(),
          name: file.name,
          status: "Processing",
          confidence: null as number | null,
          vendor: "Neural Scanning...",
          amount: "—"
        };
        setQueue(prev => [newItem, ...prev]);

        const { data, error } = await supabase.functions.invoke('ocr-service', {
          body: { image: base64 }
        });

        if (error) throw error;

        setQueue(prev => prev.map(item => 
          item.id === newItem.id 
            ? { ...item, status: "Completed", vendor: data.vendor, amount: `₹${data.total_amount}`, confidence: data.confidence } 
            : item
        ));
        
        setExtractedResult(data);
        setSelected(data);
      } catch (err) {
        console.error("OCR Error:", err);
        setQueue(prev => prev.map(item => 
          item.status === "Processing" ? { ...item, status: "Failed" } : item
        ));
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
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
              <input 
                type="file" 
                id="ocr-upload" 
                className="hidden" 
                onChange={handleUpload}
                accept="image/*,.pdf"
              />
              <button 
                onClick={() => document.getElementById('ocr-upload')?.click()} 
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
                    {item.confidence && (
                      <div className="text-[10px] font-black text-neon">{item.confidence}%</div>
                    )}
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
                { label: "Vendor", value: selected?.vendor || "—" },
                { label: "Invoice No", value: selected?.invoice_no || "—" },
                { label: "Date", value: selected?.date || "—" },
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
                {selected?.items?.map((item: any, i: number) => (
                  <tr key={i} className="border-b border-ink/5 last:border-0 hover:bg-neon/5 transition-colors">
                    <td className="p-3 text-xs font-bold uppercase tracking-tight">{item.description}</td>
                    <td className="p-3 text-xs font-black text-right">{item.quantity}</td>
                    <td className="p-3 text-xs font-black text-right data-value">₹{(item.total || 0).toLocaleString("en-IN")}</td>
                  </tr>
                )) || (
                  <tr><td colSpan={3} className="p-12 text-center text-[10px] font-black text-ink/20 uppercase">No_Items_Extracted</td></tr>
                )}
              </tbody>
              <tfoot className="bg-ink text-white">
                <tr>
                  <td colSpan={2} className="p-3 text-[10px] font-black uppercase tracking-widest">Total_Payable</td>
                  <td className="p-3 text-sm font-black text-right data-value tracking-tighter">₹{(selected?.total_amount || 0).toLocaleString("en-IN")}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
