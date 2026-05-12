import React, { useState, useRef } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertTriangle, Scan } from 'lucide-react';
import { Card, ActionBtn as Button } from '../common/UI';
import { supabase } from '../../lib/supabase';

export default function VisualAudit() {
  const [capturing, setCapturing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    setCapturing(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) videoRef.current.srcObject = stream;
  };

  const captureAndAnalyze = async () => {
    setLoading(true);
    // In a real app, we'd capture the frame from videoRef.current
    // For the demo, we simulate the base64 data
    const mockImageBase64 = "..."; 

    try {
      const { data, error } = await supabase.functions.invoke('visual-inventory', {
        body: { 
          imageBase64: mockImageBase64, 
          targetProduct: "Cement Bags" 
        }
      });
      if (error) throw error;
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 border-2 border-indigo-500/20 bg-slate-900 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
           <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
           <span className="text-[9px] font-black uppercase text-indigo-400">Scan by Photo</span>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
          <Camera size={24} />
        </div>
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Scan Your Shop Shelf</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">See stock levels with your camera</p>
        </div>
      </div>

      <div className="aspect-video bg-slate-950 rounded-3xl border-2 border-slate-800 flex items-center justify-center relative overflow-hidden mb-8 group">
        {!capturing ? (
          <Button onClick={startCamera} className="!px-8 !py-4">
            <Scan size={18} className="mr-2" /> Turn on Camera
          </Button>
        ) : (
          <>
            <video ref={videoRef} autoPlay className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 border-[40px] border-slate-950/40 pointer-events-none">
               <div className="w-full h-full border-2 border-dashed border-indigo-500/40 animate-pulse" />
            </div>
          </>
        )}
        
        {loading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <RefreshCw size={40} className="text-indigo-500 animate-spin mb-4" />
            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Scanning your shelf...</div>
          </div>
        )}
      </div>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-[9px] font-black text-slate-500 uppercase mb-2">Items Found</div>
              <div className="text-3xl font-black text-white">{result.detected_count} Items</div>
           </div>
           <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-[9px] font-black text-slate-500 uppercase mb-2">Accuracy</div>
              <div className="text-3xl font-black text-emerald-400">{Math.round(result.confidence * 100)}%</div>
           </div>
           <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-[9px] font-black text-slate-500 uppercase mb-2">Status</div>
              <div className={`text-xl font-black uppercase italic ${result.status === 'match' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {result.status === 'match' ? 'Match' : 'No Match'}
              </div>
           </div>
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <Button 
          disabled={!capturing || loading} 
          onClick={captureAndAnalyze}
          className="!bg-indigo-600 hover:!bg-indigo-500 !text-white"
        >
          Scan and Count Now
        </Button>
      </div>
    </Card>
  );
}
