import React, { useRef, useState } from 'react';
import { Language } from '../types';
import { translations } from '../translations';

interface ImageUploadProps {
  onImageSelected: (file: File) => void;
  disabled: boolean;
  language: Language;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelected, disabled, language }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const t = translations[language];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageSelected(event.target.files[0]);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsHovering(false);
    if (disabled) return;
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      onImageSelected(event.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsHovering(true);
  };

  const handleDragLeave = () => {
    setIsHovering(false);
  };

  return (
    <div className="w-full max-w-md mx-auto mb-12 perspective-1000">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={disabled}
      />
      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative group cursor-pointer transition-all duration-500
          flex flex-col items-center justify-center min-h-[240px] rounded-3xl
          glass-panel overflow-hidden
          ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:border-amber-500/30'}
          ${isHovering ? 'scale-105 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]' : ''}
        `}
      >
        {/* Animated Scanner Grid Background */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        
        {/* Scanning Line Animation */}
        {!disabled && (
          <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
             <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent absolute top-0 animate-[shimmer_2s_infinite_linear] shadow-[0_0_10px_#FBBF24]"></div>
          </div>
        )}

        <div className="z-10 bg-slate-900/50 p-5 rounded-full mb-6 border border-white/5 shadow-2xl group-hover:scale-110 transition-transform duration-500 group-hover:shadow-amber-500/20">
          <svg className="w-8 h-8 text-amber-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        
        <p className="z-10 text-white font-serif text-xl tracking-wide group-hover:text-amber-300 transition-colors">
            {t.dropZoneTitle}
        </p>
        <p className="z-10 text-slate-500 text-xs uppercase tracking-widest mt-3 border border-white/10 px-3 py-1 rounded-full bg-black/20">
            {t.dropZoneSubtitle}
        </p>
      </div>
    </div>
  );
};