import React from 'react';

export default function Background3D() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-white">
      {/* High-Tech Glowing Radial Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,_rgba(99,102,241,0.06),_transparent_75%)] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(14,165,233,0.04),_transparent_60%)] animate-pulse" style={{ animationDuration: '12s' }} />
      
      {/* High-Tech HUD Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.06]">
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid-3d" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-200" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-3d)" />
        </svg>
      </div>

      {/* Ambient Glowing Anchor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
    </div>
  );
}
