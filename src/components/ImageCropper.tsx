'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import {
  Upload,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  Check,
  Eye,
  EyeOff,
  User,
  FileSignature,
  Calendar,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { FaceGuideOverlay } from './FaceGuideOverlay';
import { PresetRequirement, ProcessedImageResult } from '@/types/presets';
import {
  processAndCompressImage,
  ProcessingOptions,
  fileToImage,
  dataUrlToImage,
} from '@/lib/imageProcessor';

interface ImageCropperProps {
  type: 'photo' | 'signature';
  requirement: PresetRequirement;
  onProcessed: (result: ProcessedImageResult | null) => void;
  externalImageSrc?: string | null;
  onImageChange?: (dataUrl: string | null) => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  type,
  requirement,
  onProcessed,
  externalImageSrc,
  onImageChange,
}) => {
  const isPhoto = type === 'photo';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Image source state
  const [imageSrc, setImageSrc] = useState<string | null>(externalImageSrc || null);
  const [originalFileKB, setOriginalFileKB] = useState<number>(0);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  // Image manipulation state
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [showFaceGuide, setShowFaceGuide] = useState<boolean>(isPhoto);

  // Name & Date overlay state (for Photo)
  const [nameDateEnabled, setNameDateEnabled] = useState<boolean>(false);
  const [candidateName, setCandidateName] = useState<string>('');
  const [photoDate, setPhotoDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Signature enhancement state (for Signature)
  const [sigEnhanceEnabled, setSigEnhanceEnabled] = useState<boolean>(!isPhoto);
  const [sigContrast, setSigContrast] = useState<number>(40);
  const [sigBrightness, setSigBrightness] = useState<number>(15);

  // Status state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Sync external image source if supplied
  useEffect(() => {
    if (externalImageSrc !== undefined && externalImageSrc !== imageSrc) {
      setImageSrc(externalImageSrc);
    }
  }, [externalImageSrc]);

  // Target aspect ratio from requirement
  const targetAspect = requirement.dimensions.width / requirement.dimensions.height;

  // Initialize center crop when image loads
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
      const initialCrop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: isPhoto ? 80 : 90,
          },
          targetAspect,
          width,
          height
        ),
        width,
        height
      );
      setCrop(initialCrop);
    },
    [targetAspect, isPhoto]
  );

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setOriginalFileKB(Math.round(file.size / 1024));
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImageSrc(result);
        if (onImageChange) onImageChange(result);
        setRotation(0);
        setScale(1);
      };
      reader.readAsDataURL(file);
    }
  };

  // Re-run compression processing whenever crop, requirements, or filters change
  const runCompression = useCallback(async () => {
    if (!imgRef.current || !imageSrc) {
      onProcessed(null);
      return;
    }

    try {
      setIsProcessing(true);

      // Create temporary canvas if rotated to get oriented image
      let effectiveImage: HTMLImageElement = imgRef.current;
      if (rotation !== 0) {
        const rotatedCanvas = document.createElement('canvas');
        const rCtx = rotatedCanvas.getContext('2d');
        const rad = (rotation * Math.PI) / 180;
        const sin = Math.abs(Math.sin(rad));
        const cos = Math.abs(Math.cos(rad));
        const origW = imgRef.current.naturalWidth;
        const origH = imgRef.current.naturalHeight;
        rotatedCanvas.width = origW * cos + origH * sin;
        rotatedCanvas.height = origW * sin + origH * cos;

        if (rCtx) {
          rCtx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
          rCtx.rotate(rad);
          rCtx.drawImage(imgRef.current, -origW / 2, -origH / 2);
          effectiveImage = await dataUrlToImage(rotatedCanvas.toDataURL('image/png'));
        }
      }

      // Convert crop percentage or pixels to scale
      let finalCrop = completedCrop;
      if (!finalCrop && imgRef.current) {
        finalCrop = {
          unit: 'px',
          x: 0,
          y: 0,
          width: effectiveImage.naturalWidth,
          height: effectiveImage.naturalHeight,
        };
      }

      // Calculate actual pixel crop on the natural image
      const scaleX = effectiveImage.naturalWidth / (imgRef.current.width || effectiveImage.naturalWidth);
      const scaleY = effectiveImage.naturalHeight / (imgRef.current.height || effectiveImage.naturalHeight);

      const actualPixelCrop = finalCrop
        ? {
            x: finalCrop.x * scaleX,
            y: finalCrop.y * scaleY,
            width: finalCrop.width * scaleX,
            height: finalCrop.height * scaleY,
            unit: 'px' as const,
          }
        : undefined;

      const options: ProcessingOptions = {
        crop: actualPixelCrop,
        targetWidth: requirement.dimensions.width,
        targetHeight: requirement.dimensions.height,
        minKB: requirement.size.minKB,
        maxKB: requirement.size.maxKB,
        format: requirement.format,
        nameAndDate: isPhoto && nameDateEnabled
          ? {
              enabled: true,
              name: candidateName,
              date: photoDate,
            }
          : undefined,
        signatureFilter: !isPhoto && sigEnhanceEnabled
          ? {
              enabled: true,
              grayscale: true,
              contrast: sigContrast,
              brightness: sigBrightness,
              removeBackground: true,
            }
          : undefined,
      };

      const result = await processAndCompressImage(effectiveImage, options);
      onProcessed(result);
    } catch (err) {
      console.error('Error processing image:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [
    imageSrc,
    completedCrop,
    requirement,
    rotation,
    isPhoto,
    nameDateEnabled,
    candidateName,
    photoDate,
    sigEnhanceEnabled,
    sigContrast,
    sigBrightness,
    onProcessed,
  ]);

  // Debounced auto-compression on change
  useEffect(() => {
    const timer = setTimeout(() => {
      runCompression();
    }, 150);
    return () => clearTimeout(timer);
  }, [runCompression]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
      {/* Header bar */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isPhoto ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {isPhoto ? <User className="w-4 h-4" /> : <FileSignature className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">
              {isPhoto ? 'Passport Photograph' : 'Candidate Signature'}
            </h3>
            <p className="text-xs text-slate-500">
              {requirement.dimensions.width}×{requirement.dimensions.height} px • Max{' '}
              {requirement.size.maxKB} KB
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs cursor-pointer transition-all"
            title="Upload new file"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{imageSrc ? 'Replace' : 'Upload'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="p-4 flex-1 flex flex-col items-center justify-center bg-slate-900/5 min-h-[360px] relative">
        {imageSrc ? (
          <div className="relative max-h-[380px] w-full flex items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-950/80 p-2 shadow-inner">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={targetAspect}
              className="relative max-h-[340px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                alt={isPhoto ? 'Candidate photo' : 'Candidate signature'}
                src={imageSrc}
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  maxHeight: '340px',
                  objectFit: 'contain',
                }}
                onLoad={onImageLoad}
                className="transition-transform duration-200"
              />

              {/* Face Guide Overlay rendered on top of crop boundary */}
              {isPhoto && <FaceGuideOverlay visible={showFaceGuide} />}
            </ReactCrop>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-full min-h-[300px] border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer bg-white transition-all group"
          >
            <div className="w-14 h-14 rounded-full bg-slate-100 group-hover:bg-emerald-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 mb-3 transition-colors">
              <Upload className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">
              Click or drag & drop {isPhoto ? 'photo' : 'signature'} here
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Supports JPEG, PNG, WEBP from your phone camera or computer. 100% processed offline.
            </p>
          </div>
        )}
      </div>

      {/* Toolbar & Controls */}
      {imageSrc && (
        <div className="p-3 bg-white border-t border-slate-100 space-y-3">
          {/* Main adjustment tools */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Rotation and Zoom */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                title="Rotate 90° Clockwise"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setScale((s) => Math.min(2.5, s + 0.1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setScale(1);
                  setRotation(0);
                }}
                className="px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium cursor-pointer"
                title="Reset zoom & rotation"
              >
                Reset
              </button>
            </div>

            {/* Photo specific: Face Guide Toggle */}
            {isPhoto && (
              <button
                onClick={() => setShowFaceGuide((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                  showFaceGuide
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                {showFaceGuide ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>Face Guide: {showFaceGuide ? 'ON' : 'OFF'}</span>
              </button>
            )}

            {/* Signature specific: Auto-Clean White Background Toggle */}
            {!isPhoto && (
              <button
                onClick={() => setSigEnhanceEnabled((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                  sigEnhanceEnabled
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Crisp B&W Ink: {sigEnhanceEnabled ? 'ON' : 'OFF'}</span>
              </button>
            )}
          </div>

          {/* Photo Extra: Name & Date Banner Input (UPSC / SSC / Govt Requirement) */}
          {isPhoto && (
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={nameDateEnabled}
                    onChange={(e) => setNameDateEnabled(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Inscribe Candidate Name & Date of Photo (e.g., UPSC OTR / SSC)</span>
                </label>
              </div>

              {nameDateEnabled && (
                <div className="grid grid-cols-2 gap-2 pt-1 animate-fadeIn">
                  <div>
                    <input
                      type="text"
                      placeholder="Candidate Full Name"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      value={photoDate}
                      onChange={(e) => setPhotoDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Signature Extra: Fine Contrast Sliders */}
          {!isPhoto && sigEnhanceEnabled && (
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-600 text-[11px]">
                <span>Ink Contrast Boost: {sigContrast}%</span>
                <span>Background Brightness: +{sigBrightness}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sigContrast}
                  onChange={(e) => setSigContrast(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <input
                  type="range"
                  min="-20"
                  max="50"
                  value={sigBrightness}
                  onChange={(e) => setSigBrightness(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

