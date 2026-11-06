'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Camera,
  FileSignature,
  Download,
  Settings2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight,
  Archive,
  RefreshCw,
  HelpCircle,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import { EXAM_PRESETS, ExamPreset, ProcessedImageResult } from '@/types/presets';
import { ImageCropper } from '@/components/ImageCropper';
import { ComplianceFeedback } from '@/components/ComplianceFeedback';
import { CustomPresetModal } from '@/components/CustomPresetModal';
import {
  triggerDownload,
  createSamplePhoto,
  createSampleSignature,
} from '@/lib/imageProcessor';

export default function FormPhotoFixerPage() {
  // Preset selection
  const [presets, setPresets] = useState<ExamPreset[]>(EXAM_PRESETS);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('upsc');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);

  // Active preset object
  const activePreset =
    presets.find((p) => p.id === selectedPresetId) || presets[0];

  // Images state
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [signatureSrc, setSignatureSrc] = useState<string | null>(null);

  // Processed results
  const [processedPhoto, setProcessedPhoto] =
    useState<ProcessedImageResult | null>(null);
  const [processedSignature, setProcessedSignature] =
    useState<ProcessedImageResult | null>(null);

  // Process status
  const [photoProcessing, setPhotoProcessing] = useState<boolean>(false);
  const [signatureProcessing, setSignatureProcessing] = useState<boolean>(false);

  // Confetti trigger when both ready
  const [hasCelebrated, setHasCelebrated] = useState<boolean>(false);

  // Overall compliance check
  const isPhotoReady = processedPhoto?.isCompliant ?? false;
  const isSignatureReady = processedSignature?.isCompliant ?? false;
  const isAllReady = isPhotoReady && isSignatureReady;

  useEffect(() => {
    if (isAllReady && !hasCelebrated) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#3b82f6', '#10b981'],
        });
      } catch (e) {
        // Ignore confetti if not supported
      }
      setHasCelebrated(true);
    }
  }, [isAllReady, hasCelebrated]);

  // Load sample images for 1-click test drive
  const handleLoadSamples = useCallback(() => {
    const sampleP = createSamplePhoto();
    const sampleS = createSampleSignature();
    setPhotoSrc(sampleP);
    setSignatureSrc(sampleS);
    setHasCelebrated(false);
  }, []);

  // Reset all
  const handleReset = () => {
    setPhotoSrc(null);
    setSignatureSrc(null);
    setProcessedPhoto(null);
    setProcessedSignature(null);
    setHasCelebrated(false);
  };

  // Add custom preset
  const handleApplyCustomPreset = (customPreset: ExamPreset) => {
    setPresets((prev) => [customPreset, ...prev.filter((p) => p.id !== customPreset.id)]);
    setSelectedPresetId(customPreset.id);
  };

  // Download photo handler
  const handleDownloadPhoto = () => {
    if (!processedPhoto) return;
    const extension = activePreset.photo.format.replace('image/', '') || 'jpg';
    const filename = `${activePreset.id.toUpperCase()}_Photo_${processedPhoto.width}x${
      processedPhoto.height
    }_${processedPhoto.fileSizeKB}KB.${extension === 'jpeg' ? 'jpg' : extension}`;
    triggerDownload(processedPhoto.blob, filename);
  };

  // Download signature handler
  const handleDownloadSignature = () => {
    if (!processedSignature) return;
    const extension = activePreset.signature.format.replace('image/', '') || 'jpg';
    const filename = `${activePreset.id.toUpperCase()}_Signature_${
      processedSignature.width
    }x${processedSignature.height}_${processedSignature.fileSizeKB}KB.${
      extension === 'jpeg' ? 'jpg' : extension
    }`;
    triggerDownload(processedSignature.blob, filename);
  };

  // Download both as a zip bundle
  const handleDownloadBoth = async () => {
    if (!processedPhoto && !processedSignature) return;
    const zip = new JSZip();

    if (processedPhoto) {
      const ext = activePreset.photo.format.replace('image/', '') === 'jpeg' ? 'jpg' : 'png';
      zip.file(
        `${activePreset.id.toUpperCase()}_Photo_${processedPhoto.width}x${
          processedPhoto.height
        }_${processedPhoto.fileSizeKB}KB.${ext}`,
        processedPhoto.blob
      );
    }

    if (processedSignature) {
      const ext = activePreset.signature.format.replace('image/', '') === 'jpeg' ? 'jpg' : 'png';
      zip.file(
        `${activePreset.id.toUpperCase()}_Signature_${processedSignature.width}x${
          processedSignature.height
        }_${processedSignature.fileSizeKB}KB.${ext}`,
        processedSignature.blob
      );
    }

    // Add README verification note inside zip
    const readmeText = `FORM PHOTO FIXER - EXAM SPECIFICATION SUMMARY
Preset: ${activePreset.name}
Generated At: ${new Date().toLocaleString()}

Photograph:
- Dimensions: ${processedPhoto ? `${processedPhoto.width}x${processedPhoto.height} px` : 'N/A'}
- Size: ${processedPhoto ? `${processedPhoto.fileSizeKB} KB` : 'N/A'} (Allowed: ${activePreset.photo.size.minKB}-${activePreset.photo.size.maxKB} KB)
- Status: ${processedPhoto?.isCompliant ? '100% Compliant' : 'Warning'}

Signature:
- Dimensions: ${processedSignature ? `${processedSignature.width}x${processedSignature.height} px` : 'N/A'}
- Size: ${processedSignature ? `${processedSignature.fileSizeKB} KB` : 'N/A'} (Allowed: ${activePreset.signature.size.minKB}-${activePreset.signature.size.maxKB} KB)
- Status: ${processedSignature?.isCompliant ? '100% Compliant' : 'Warning'}

All processing performed 100% client-side via Canvas API.
`;
    zip.file('compliance-report.txt', readmeText);

    const content = await zip.generateAsync({ type: 'blob' });
    triggerDownload(content, `${activePreset.id.toUpperCase()}_Form_Photos_Compliant.zip`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 text-lg tracking-tight">
                  Form Photo Fixer
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  100% Offline / In-Browser
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Exact Exam Dimensions & Dynamic KB Size Compression in 1 Step
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSamples}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 cursor-pointer transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Load Sample Demo</span>
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              title="Reset everything"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Presets Selector Banner */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Step 1
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Select Exam / Job Application Preset
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Each preset automatically configures exact pixel dimensions, aspect ratio, and strict KB limits.
              </p>
            </div>

            {/* Custom preset button */}
            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer transition-all self-start md:self-auto"
            >
              <Settings2 className="w-4 h-4 text-slate-600" />
              <span>Set Custom Dimensions & KB</span>
            </button>
          </div>

          {/* Preset Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-4">
            {presets.map((preset) => {
              const isSelected = preset.id === selectedPresetId;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setSelectedPresetId(preset.id);
                    setHasCelebrated(false);
                  }}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                  }`}
                >
                  {preset.badge && (
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full absolute top-2 right-2 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {preset.badge}
                    </span>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs truncate pr-6">
                      {preset.name.split('(')[0]}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                      {preset.photo.size.minKB}-{preset.photo.size.maxKB} KB
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                    {preset.photo.dimensions.width}×{preset.photo.dimensions.height}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Preset Information Pill */}
          <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-sm">{activePreset.name}</span>
                <span className="text-slate-500">• {activePreset.description}</span>
              </div>
              <div className="text-slate-600 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                <span>
                  📷 <strong>Photo:</strong> {activePreset.photo.dimensions.width}×
                  {activePreset.photo.dimensions.height} px (
                  {activePreset.photo.size.minKB > 0
                    ? `${activePreset.photo.size.minKB}-${activePreset.photo.size.maxKB} KB`
                    : `Max ${activePreset.photo.size.maxKB} KB`}
                  )
                </span>
                <span>
                  ✍️ <strong>Signature:</strong> {activePreset.signature.dimensions.width}×
                  {activePreset.signature.dimensions.height} px (
                  {activePreset.signature.size.minKB > 0
                    ? `${activePreset.signature.size.minKB}-${activePreset.signature.size.maxKB} KB`
                    : `Max ${activePreset.signature.size.maxKB} KB`}
                  )
                </span>
              </div>
            </div>

            {/* Quick status pill */}
            <div className="shrink-0">
              {isAllReady ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Both Files 100% Ready
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
                  {processedPhoto ? 'Photo ready' : 'Upload photo'} •{' '}
                  {processedSignature ? 'Signature ready' : 'Upload signature'}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* 2-Column Photo and Signature Workspace */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Photograph Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  Item 1
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Candidate Photograph
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Face Guide overlay aligns head & shoulders
              </span>
            </div>

            {/* Cropper */}
            <ImageCropper
              type="photo"
              requirement={activePreset.photo}
              onProcessed={(res) => setProcessedPhoto(res)}
              externalImageSrc={photoSrc}
              onImageChange={(src) => setPhotoSrc(src)}
            />

            {/* Compliance Feedback with Real-Time Progress Bar */}
            <ComplianceFeedback
              label="Photograph"
              requirement={activePreset.photo}
              result={processedPhoto}
              isProcessing={photoProcessing}
            />

            {/* Download single photo button */}
            {processedPhoto && (
              <button
                onClick={handleDownloadPhoto}
                disabled={!processedPhoto}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>
                  Download Photo Only ({processedPhoto.fileSizeKB} KB •{' '}
                  {processedPhoto.width}×{processedPhoto.height} px)
                </span>
              </button>
            )}
          </div>

          {/* RIGHT: Signature Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Item 2
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Candidate Signature
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Auto-whitens phone shadow background
              </span>
            </div>

            {/* Cropper */}
            <ImageCropper
              type="signature"
              requirement={activePreset.signature}
              onProcessed={(res) => setProcessedSignature(res)}
              externalImageSrc={signatureSrc}
              onImageChange={(src) => setSignatureSrc(src)}
            />

            {/* Compliance Feedback with Real-Time Progress Bar */}
            <ComplianceFeedback
              label="Signature"
              requirement={activePreset.signature}
              result={processedSignature}
              isProcessing={signatureProcessing}
            />

            {/* Download single signature button */}
            {processedSignature && (
              <button
                onClick={handleDownloadSignature}
                disabled={!processedSignature}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>
                  Download Signature Only ({processedSignature.fileSizeKB} KB •{' '}
                  {processedSignature.width}×{processedSignature.height} px)
                </span>
              </button>
            )}
          </div>
        </section>

        {/* Global Action Banner & Both Downloads */}
        <section className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                  Step 2: Export Compliant Files
                </span>
                {isAllReady && (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Both Files Verified
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold">
                Download Exam-Compliant Files for {activePreset.name}
              </h3>
              <p className="text-xs text-slate-300">
                Downloaded files are guaranteed to match the target pixel dimensions and stay strictly under the portal&apos;s KB limit. No uploads to any remote server — all processing completed in your browser.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Download Both ZIP */}
              <button
                onClick={handleDownloadBoth}
                disabled={!processedPhoto && !processedSignature}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer ${
                  isAllReady
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
                    : processedPhoto || processedSignature
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Archive className="w-4 h-4" />
                <span>Download Both as ZIP</span>
              </button>
            </div>
          </div>
        </section>

        {/* Educational Guide / Exam Rules Footer */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs text-xs text-slate-600 space-y-4">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            Frequently Asked Exam Portal Photo & Signature Guidelines
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <div className="font-semibold text-slate-800">1. Why do portals reject photos?</div>
              <p className="text-slate-500">
                Most portal rejections happen because the file is either 1 KB above the maximum limit, or the face occupies less than 70% of the picture. Use our Face Guide overlay to center your head and shoulders.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <div className="font-semibold text-slate-800">2. Why signature contrast matters</div>
              <p className="text-slate-500">
                Phone camera photos of white paper often have yellow shadows or grey tints that exam scanners flag as blurry. Our &apos;Crisp B&W Ink&apos; toggle eliminates shadow backgrounds and sharpens ink strokes.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <div className="font-semibold text-slate-800">3. Is my photo uploaded anywhere?</div>
              <p className="text-slate-500">
                No. All image resizing, canvas drawing, and iterative JPEG compression happen strictly in your browser&apos;s JavaScript engine. It works completely offline with zero server data storage.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        <p>Form Photo Fixer • Client-Side Exam Photo & Signature Optimizer • Next.js & Tailwind CSS</p>
      </footer>

      {/* Custom Preset Modal */}
      <CustomPresetModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onApply={handleApplyCustomPreset}
        initialPreset={activePreset}
      />
    </div>
  );
}

