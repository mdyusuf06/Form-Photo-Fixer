'use client';

import React, { useState } from 'react';
import { X, Check, Settings2, HelpCircle } from 'lucide-react';
import { ExamPreset } from '@/types/presets';

interface CustomPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (preset: ExamPreset) => void;
  initialPreset?: ExamPreset;
}

export const CustomPresetModal: React.FC<CustomPresetModalProps> = ({
  isOpen,
  onClose,
  onApply,
  initialPreset,
}) => {
  // Preset Name & Unit
  const [name, setName] = useState('My Custom Form Requirements');
  const [unit, setUnit] = useState<'px' | 'cm'>('px');

  // Photo
  const [photoWidth, setPhotoWidth] = useState(
    initialPreset?.photo.dimensions.width || 350
  );
  const [photoHeight, setPhotoHeight] = useState(
    initialPreset?.photo.dimensions.height || 450
  );
  const [photoMinKB, setPhotoMinKB] = useState(
    initialPreset?.photo.size.minKB || 10
  );
  const [photoMaxKB, setPhotoMaxKB] = useState(
    initialPreset?.photo.size.maxKB || 100
  );

  // Signature
  const [sigWidth, setSigWidth] = useState(
    initialPreset?.signature.dimensions.width || 350
  );
  const [sigHeight, setSigHeight] = useState(
    initialPreset?.signature.dimensions.height || 150
  );
  const [sigMinKB, setSigMinKB] = useState(
    initialPreset?.signature.size.minKB || 5
  );
  const [sigMaxKB, setSigMaxKB] = useState(
    initialPreset?.signature.size.maxKB || 50
  );

  // Format
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');

  if (!isOpen) return null;

  // Conversion helper if unit is cm (at 300 DPI: 1 cm = 118 px)
  const handleApply = () => {
    const finalPhotoW = unit === 'cm' ? Math.round(photoWidth * 118.11) : photoWidth;
    const finalPhotoH = unit === 'cm' ? Math.round(photoHeight * 118.11) : photoHeight;
    const finalSigW = unit === 'cm' ? Math.round(sigWidth * 118.11) : sigWidth;
    const finalSigH = unit === 'cm' ? Math.round(sigHeight * 118.11) : sigHeight;

    const customPreset: ExamPreset = {
      id: 'custom-' + Date.now(),
      name: name.trim() || 'Custom Requirement',
      category: 'custom',
      description: `Custom Photo (${finalPhotoW}×${finalPhotoH}px, max ${photoMaxKB}KB) & Signature (${finalSigW}×${finalSigH}px, max ${sigMaxKB}KB)`,
      badge: 'Custom',
      photo: {
        dimensions: {
          width: Math.max(50, finalPhotoW),
          height: Math.max(50, finalPhotoH),
          unit: 'px',
        },
        size: {
          minKB: Math.max(0, photoMinKB),
          maxKB: Math.max(5, photoMaxKB),
        },
        aspectRatio: finalPhotoW / finalPhotoH,
        description: `Custom ${finalPhotoW}×${finalPhotoH}px, max ${photoMaxKB} KB`,
        format,
      },
      signature: {
        dimensions: {
          width: Math.max(50, finalSigW),
          height: Math.max(20, finalSigH),
          unit: 'px',
        },
        size: {
          minKB: Math.max(0, sigMinKB),
          maxKB: Math.max(5, sigMaxKB),
        },
        aspectRatio: finalSigW / finalSigH,
        description: `Custom ${finalSigW}×${finalSigH}px, max ${sigMaxKB} KB`,
        format,
      },
    };

    onApply(customPreset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-base">Custom Form Requirements</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Preset Title */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Specification Label
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. State Public Service Commission / Railway RRB"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Unit Toggle & Output format */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Dimension Units
              </label>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setUnit('px')}
                  className={`py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    unit === 'px' ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500'
                  }`}
                >
                  Pixels (px)
                </button>
                <button
                  type="button"
                  onClick={() => setUnit('cm')}
                  className={`py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    unit === 'cm' ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500'
                  }`}
                >
                  Centimeters (cm)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                Image Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="image/jpeg">JPEG / JPG (Standard for Forms)</option>
                <option value="image/png">PNG</option>
                <option value="image/webp">WEBP</option>
              </select>
            </div>
          </div>

          {/* Photo Specifications */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="font-semibold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>Photograph Requirements</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Width ({unit})</label>
                <input
                  type="number"
                  value={photoWidth}
                  onChange={(e) => setPhotoWidth(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Height ({unit})</label>
                <input
                  type="number"
                  value={photoHeight}
                  onChange={(e) => setPhotoHeight(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Min File Size (KB)</label>
                <input
                  type="number"
                  value={photoMinKB}
                  onChange={(e) => setPhotoMinKB(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-semibold text-emerald-800">
                  Max File Size (KB)*
                </label>
                <input
                  type="number"
                  value={photoMaxKB}
                  onChange={(e) => setPhotoMaxKB(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-emerald-400 rounded-lg text-sm bg-white mt-1 ring-1 ring-emerald-300"
                />
              </div>
            </div>
          </div>

          {/* Signature Specifications */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="font-semibold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>Signature Requirements</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Width ({unit})</label>
                <input
                  type="number"
                  value={sigWidth}
                  onChange={(e) => setSigWidth(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Height ({unit})</label>
                <input
                  type="number"
                  value={sigHeight}
                  onChange={(e) => setSigHeight(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500">Min File Size (KB)</label>
                <input
                  type="number"
                  value={sigMinKB}
                  onChange={(e) => setSigMinKB(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-semibold text-emerald-800">
                  Max File Size (KB)*
                </label>
                <input
                  type="number"
                  value={sigMaxKB}
                  onChange={(e) => setSigMaxKB(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-emerald-400 rounded-lg text-sm bg-white mt-1 ring-1 ring-emerald-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200/60 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm cursor-pointer transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Apply Custom Preset</span>
          </button>
        </div>
      </div>
    </div>
  );
};

