import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Form Photo Fixer - Instant 1-Step Exam Photo & Signature Compliant Converter',
  description: '100% Client-side privacy-first tool to resize, crop with head/face guide, and dynamically compress photo and signature for UPSC, SSC, IBPS, GATE, and custom exam application forms.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

