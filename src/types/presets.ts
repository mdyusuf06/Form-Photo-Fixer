export interface DimensionConfig {
  width: number; // in pixels
  height: number; // in pixels
  unit?: 'px' | 'cm' | 'inch';
  physicalWidth?: number; // e.g. 3.5 cm
  physicalHeight?: number; // e.g. 4.5 cm
  dpi?: number;
}

export interface SizeConfig {
  minKB: number;
  maxKB: number;
  recommendedKB?: number;
}

export interface PresetRequirement {
  dimensions: DimensionConfig;
  size: SizeConfig;
  aspectRatio: number; // width / height
  description: string;
  format: 'image/jpeg' | 'image/png' | 'image/webp';
  instructions?: string[];
}

export interface ExamPreset {
  id: string;
  name: string;
  category: 'government' | 'banking' | 'engineering' | 'medical' | 'custom';
  description: string;
  badge?: string;
  photo: PresetRequirement;
  signature: PresetRequirement;
  hasNameDateOption?: boolean; // e.g. UPSC requires name and date of photo
}

export const EXAM_PRESETS: ExamPreset[] = [
  {
    id: 'upsc',
    name: 'UPSC (Civil Services & NDA)',
    category: 'government',
    description: 'Union Public Service Commission (OTR & Exam Applications)',
    badge: 'Popular',
    hasNameDateOption: true,
    photo: {
      dimensions: { width: 350, height: 450, physicalWidth: 3.5, physicalHeight: 4.5, unit: 'cm', dpi: 300 },
      size: { minKB: 20, maxKB: 300, recommendedKB: 80 },
      aspectRatio: 350 / 450,
      description: '3.5 x 4.5 cm (350×450 px), 20 KB to 300 KB, clear front view, 3/4 face visible',
      format: 'image/jpeg',
      instructions: [
        'Plain white or light-coloured background',
        'Head and shoulders should cover 75% of photograph',
        'OtR now accepts candidate name & date inscribed at bottom',
      ],
    },
    signature: {
      dimensions: { width: 350, height: 150, physicalWidth: 3.5, physicalHeight: 1.5, unit: 'cm', dpi: 300 },
      size: { minKB: 20, maxKB: 300, recommendedKB: 50 },
      aspectRatio: 350 / 150,
      description: '350×150 px (approx 7:3 aspect ratio), 20 KB to 300 KB',
      format: 'image/jpeg',
      instructions: ['Black ink on white unruled paper', 'Do not sign in ALL CAPS'],
    },
  },
  {
    id: 'ssc',
    name: 'SSC (CGL, CHSL, MTS, GD)',
    category: 'government',
    description: 'Staff Selection Commission - strict 20-50 KB & 10-20 KB limits',
    badge: 'Strict Size',
    hasNameDateOption: true,
    photo: {
      dimensions: { width: 350, height: 450, physicalWidth: 3.5, physicalHeight: 4.5, unit: 'cm', dpi: 300 },
      size: { minKB: 20, maxKB: 50, recommendedKB: 38 },
      aspectRatio: 350 / 450,
      description: '3.5 x 4.5 cm, strictly 20 KB - 50 KB, JPEG',
      format: 'image/jpeg',
      instructions: [
        'Strictly between 20 KB and 50 KB',
        'White or very light background only',
        'Both ears must be clearly visible without spectacles or caps',
      ],
    },
    signature: {
      dimensions: { width: 400, height: 200, physicalWidth: 4.0, physicalHeight: 2.0, unit: 'cm', dpi: 300 },
      size: { minKB: 10, maxKB: 20, recommendedKB: 15 },
      aspectRatio: 400 / 200,
      description: '4.0 x 2.0 cm, strictly 10 KB - 20 KB, JPEG',
      format: 'image/jpeg',
      instructions: ['Strictly 10 KB to 20 KB', 'Running handwriting on crisp white sheet with black pen'],
    },
  },
  {
    id: 'ibps',
    name: 'IBPS / SBI (PO & Clerk)',
    category: 'banking',
    description: 'Institute of Banking Personnel Selection & State Bank of India',
    badge: 'Banking',
    photo: {
      dimensions: { width: 200, height: 230, physicalWidth: 3.5, physicalHeight: 4.5, unit: 'cm', dpi: 200 },
      size: { minKB: 20, maxKB: 50, recommendedKB: 35 },
      aspectRatio: 200 / 230,
      description: '200×230 px, strictly 20 KB - 50 KB, 4.5 x 3.5 cm',
      format: 'image/jpeg',
      instructions: [
        'Dimensions: 200 x 230 pixels (preferred)',
        'File size: 20 KB to 50 KB',
        'Light-coloured (preferably white) background',
      ],
    },
    signature: {
      dimensions: { width: 140, height: 60, physicalWidth: 4.0, physicalHeight: 1.7, unit: 'cm', dpi: 200 },
      size: { minKB: 10, maxKB: 20, recommendedKB: 15 },
      aspectRatio: 140 / 60,
      description: '140×60 px, strictly 10 KB - 20 KB',
      format: 'image/jpeg',
      instructions: [
        'Dimensions: 140 x 60 pixels',
        'Size: 10 KB - 20 KB',
        'Sign with Black Ink pen on white paper',
      ],
    },
  },
  {
    id: 'gate',
    name: 'GATE / JAM (IITs)',
    category: 'engineering',
    description: 'Graduate Aptitude Test in Engineering / Joint Admission test for Masters',
    photo: {
      dimensions: { width: 480, height: 640, physicalWidth: 3.5, physicalHeight: 4.5, unit: 'cm', dpi: 300 },
      size: { minKB: 5, maxKB: 200, recommendedKB: 80 },
      aspectRatio: 480 / 640,
      description: 'Aspect ratio 3:4 (e.g. 480×640 px), 5 KB to 200 KB',
      format: 'image/jpeg',
      instructions: [
        'Aspect ratio: 0.75 (width/height ratio 3:4)',
        'Face must cover 60-70% of the photograph area',
      ],
    },
    signature: {
      dimensions: { width: 560, height: 160, physicalWidth: 5.6, physicalHeight: 1.6, unit: 'cm', dpi: 300 },
      size: { minKB: 5, maxKB: 100, recommendedKB: 40 },
      aspectRatio: 560 / 160,
      description: '560×160 px, 5 KB to 100 KB',
      format: 'image/jpeg',
      instructions: ['Aspect ratio ~ 3.5:1', 'Blue or black ballpoint pen on plain white paper'],
    },
  },
  {
    id: 'nta-neet',
    name: 'NTA (NEET / JEE Main)',
    category: 'medical',
    description: 'National Testing Agency - Medical & Engineering Entrance',
    photo: {
      dimensions: { width: 350, height: 450, physicalWidth: 3.5, physicalHeight: 4.5, unit: 'cm', dpi: 300 },
      size: { minKB: 10, maxKB: 200, recommendedKB: 80 },
      aspectRatio: 350 / 450,
      description: 'Passport size photo (3.5 x 4.5 cm), 10 KB to 200 KB',
      format: 'image/jpeg',
      instructions: [
        'White background, 80% face coverage',
        'Spectacles allowed only if used regularly',
      ],
    },
    signature: {
      dimensions: { width: 400, height: 200, physicalWidth: 4.0, physicalHeight: 2.0, unit: 'cm', dpi: 300 },
      size: { minKB: 4, maxKB: 30, recommendedKB: 20 },
      aspectRatio: 400 / 200,
      description: '4.0 x 2.0 cm, 4 KB to 30 KB',
      format: 'image/jpeg',
      instructions: ['Running hand with black pen on white unlined paper', 'No capitals / initials only'],
    },
  },
];

export interface ProcessedImageResult {
  blob: Blob;
  dataUrl: string;
  fileSizeBytes: number;
  fileSizeKB: number;
  width: number;
  height: number;
  quality: number; // 0 to 1
  iterations: number;
  isCompliant: boolean;
  complianceIssues: string[];
}

