'use client';

import React, { useEffect } from 'react';

interface ImageOverlayProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export default function ImageOverlay({ src, alt, onClose }: ImageOverlayProps) {
  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent scrolling on body when overlay is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const isPDF = src.toLowerCase().endsWith('.pdf');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50 shadow-xl"
        aria-label="Close overlay"
      >
        <span className="text-2xl">✕</span>
      </button>

      <div 
        className={`relative flex items-center justify-center ${isPDF ? 'w-[85vw] h-[85vh]' : 'max-w-[90vw] max-h-[90vh]'}`}
        onClick={(e) => e.stopPropagation()} 
      >
        {isPDF ? (
          <iframe 
            src={`${src}#toolbar=0&navpanes=0`} 
            className="w-full h-full rounded-lg bg-white shadow-2xl"
            title={alt}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={src} 
            alt={alt} 
            className="max-w-full max-h-[90vh] object-contain shadow-2xl rounded-lg"
          />
        )}
      </div>
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white/70 text-sm font-medium shadow-lg">
        {alt}
      </div>
    </div>
  );
}
