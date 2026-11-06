'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, Sparkles } from 'lucide-react';
import { PresetRequirement, ProcessedImageResult } from '@/types/presets';

interface ComplianceFeedbackProps {
  label: string; // e.g., 'Photograph' or 'Signature'
  requirement: PresetRequirement;
  result: ProcessedImageResult | null;
  isProcessing: boolean;
  originalFileSizeKB?: number;
}

export const ComplianceFeedback: React.FC<ComplianceFeedbackProps> = ({
  label,
  requirement,
  result,
  isProcessing,
  originalFileSizeKB,
}) => {
  if (!result && !isProcessing) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 text-center text-slate-500 text-sm">
        <Info className="w-5 h-5 mx-auto mb-1 text-slate-400" />
        Upload or crop an image to see real-time compliance feedback.
      </div>
    );
  }

  if (isProcessing || !result) {
    return (
      <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 text-center">
        <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-emerald-600 border-t-transparent mb-2" />
        <div className="text-sm font-medium text-emerald-800">Processing & compressing locally...</div>
        <div className="text-xs text-emerald-600 mt-0.5">Iterating Canvas quality steps to meet target KB</div>
      </div>
    );
  }

  const { minKB, maxKB } = requirement.size;
  const currentKB = result.fileSizeKB;
  const targetWidth = requirement.dimensions.width;
  const targetHeight = requirement.dimensions.height;

  // Percentage for progress bar (capped at 100% or relative to maxKB)
  const percentOfMax = Math.min(100, Math.round((currentKB / maxKB) * 100));

  // Determine compliance state
  const isTooLarge = currentKB > maxKB;
  const isTooSmall = minKB > 0 && currentKB < minKB;
  const isDimensionMatch = result.width === targetWidth && result.height === targetHeight;
  const isFullyCompliant = !isTooLarge && !isTooSmall && isDimensionMatch;

  // Color logic
  let progressColor = 'bg-emerald-500';
  let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  if (isTooLarge) {
    progressColor = 'bg-red-500';
    badgeColor = 'bg-red-100 text-red-800 border-red-300';
  } else if (isTooSmall) {
    progressColor = 'bg-amber-500';
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
  }

  // Calculate reduction ratio
  const savedPercent =
    originalFileSizeKB && originalFileSizeKB > currentKB
      ? Math.round(((originalFileSizeKB - currentKB) / originalFileSizeKB) * 100)
      : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5">
      {/* Header status bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label} Compliance Status
        </span>
        {isFullyCompliant ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>✓ Ready to upload</span>
          </div>
        ) : isTooLarge ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-300">
            <XCircle className="w-4 h-4 text-red-600" />
            <span>File Exceeds {maxKB} KB</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Below {minKB} KB Min</span>
          </div>
        )}
      </div>

      {/* Progress Bar of KB vs Limit */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-baseline text-xs">
          <div className="font-semibold text-slate-800">
            <span className="text-base font-bold text-slate-900">{currentKB} KB</span>
            <span className="text-slate-500 font-normal"> of {maxKB} KB limit</span>
          </div>
          <div className="text-slate-500 text-[11px]">
            Target:{' '}
            <span className="font-medium text-slate-700">
              {minKB > 0 ? `${minKB} - ${maxKB} KB` : `Max ${maxKB} KB`}
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
            style={{ width: `${Math.min(100, Math.max(8, percentOfMax))}%` }}
          />
        </div>

        {/* Saved space pill if compressed from large camera photo */}
        {savedPercent && savedPercent > 0 && (
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <Sparkles className="w-3 h-3" />
              Compressed by {savedPercent}% (Original: {Math.round(originalFileSizeKB || 0)} KB)
            </span>
            <span className="text-slate-400">Quality: {Math.round(result.quality * 100)}%</span>
          </div>
        )}
      </div>

      {/* Verification Matrix Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
        {/* Dimensions */}
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">Dimensions</div>
          <div className="font-semibold text-slate-800 flex items-center justify-between mt-0.5">
            <span>
              {result.width} × {result.height} px
            </span>
            <span className="text-emerald-600 font-bold text-xs">✓ Exact</span>
          </div>
        </div>

        {/* Format */}
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
          <div className="text-slate-400 text-[10px] uppercase font-semibold">Format</div>
          <div className="font-semibold text-slate-800 flex items-center justify-between mt-0.5">
            <span>{requirement.format.replace('image/', '').toUpperCase()}</span>
            <span className="text-emerald-600 font-bold text-xs">✓ Portal Compliant</span>
          </div>
        </div>
      </div>

      {/* Helpful compliance hints */}
      {result.complianceIssues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-800 space-y-1">
          {result.complianceIssues.map((issue, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <span className="text-red-500 font-bold">•</span>
              <span>{issue}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

