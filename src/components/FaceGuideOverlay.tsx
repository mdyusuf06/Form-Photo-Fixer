'use client';

import React from 'react';

interface FaceGuideOverlayProps {
  visible: boolean;
}

export const FaceGuideOverlay: React.FC<FaceGuideOverlayProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center select-none overflow-hidden">
      {/* Semi-transparent dark vignette outside guide area */}
      <div className="absolute inset-0 border-[2px] border-emerald-400/80 shadow-[inset_0_0_0_1000px_rgba(15,23,42,0.22)]" />

      {/* Guide Container Scaled to Crop Area */}
      <div className="relative w-full h-full flex flex-col items-center justify-between p-4">
        {/* Crown guide line */}
        <div className="w-24 border-t-2 border-dashed border-emerald-400/90 text-[10px] text-emerald-200 text-center -mt-1 font-mono tracking-wider">
          TOP OF HEAD
        </div>

        {/* Head / Face Oval */}
        <div className="relative w-[56%] h-[58%] border-2 border-dashed border-emerald-400 rounded-[50%] flex flex-col items-center justify-center shadow-sm">
          {/* Eye Level Line */}
          <div className="absolute top-[42%] w-full flex items-center justify-between px-2">
            <span className="w-3 border-t-2 border-emerald-300" />
            <span className="text-[9px] font-mono font-medium text-emerald-300 bg-emerald-950/70 px-1 rounded">
              EYE LEVEL
            </span>
            <span className="w-3 border-t-2 border-emerald-300" />
          </div>

          {/* Chin Indicator */}
          <div className="absolute bottom-1 text-[9px] font-mono text-emerald-300 bg-emerald-950/70 px-1 rounded">
            CHIN
          </div>

          {/* Center Crosshair */}
          <div className="w-3 h-3 relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-emerald-400/60 -translate-x-1/2" />
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-emerald-400/60 -translate-y-1/2" />
          </div>
        </div>

        {/* Shoulder Arc Guide */}
        <div className="w-[85%] h-[16%] -mb-1 relative flex items-center justify-center">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 25" preserveAspectRatio="none">
            <path
              d="M 2 24 Q 50 -2 98 24"
              fill="none"
              stroke="#34d399"
              strokeWidth="1.8"
              strokeDasharray="3 2"
            />
          </svg>
          <span className="absolute bottom-1 text-[9px] font-mono text-emerald-300 bg-emerald-950/70 px-1 rounded">
            SHOULDERS
          </span>
        </div>
      </div>

      {/* Guide instructions badge */}
      <div className="absolute top-2 right-2 bg-slate-900/85 backdrop-blur-xs text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/40 font-medium">
        Align eyes & shoulders
      </div>
    </div>
  );
};

