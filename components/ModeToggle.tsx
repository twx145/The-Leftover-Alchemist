
import React from 'react';
import { ChefMode, Language } from '../types';
import { translations } from '../translations';

interface ModeToggleProps {
  currentMode: ChefMode;
  onToggle: (mode: ChefMode) => void;
  disabled: boolean;
  language: Language;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({ currentMode, onToggle, disabled, language }) => {
  const t = translations[language];

  const getGlow = (mode: ChefMode) => {
    if (mode === ChefMode.MICHELIN) return 'shadow-[0_0_20px_rgba(245,158,11,0.3)] border-amber-500/50';
    if (mode === ChefMode.HELL) return 'shadow-[0_0_20px_rgba(147,51,234,0.3)] border-purple-500/50';
    return 'shadow-[0_0_20px_rgba(59,130,246,0.3)] border-blue-500/50';
  };

  return (
    <div className="flex justify-center mb-10 px-4">
      <div className="glass-panel p-1.5 rounded-2xl flex flex-wrap justify-center gap-2 md:gap-0 relative">
        
        {/* Helper for visual connection - Added pointer-events-none to prevent blocking clicks */}
        <div className={`absolute -inset-1 rounded-2xl opacity-20 blur-xl transition-colors duration-500 pointer-events-none
            ${currentMode === ChefMode.MICHELIN ? 'bg-amber-500' : (currentMode === ChefMode.HELL ? 'bg-purple-600' : 'bg-blue-500')}
        `}></div>

        <button
          onClick={() => onToggle(ChefMode.MICHELIN)}
          disabled={disabled}
          className={`relative z-10 px-6 py-3 rounded-xl text-xs md:text-sm font-medium transition-all duration-300 flex items-center gap-2 border ${
            currentMode === ChefMode.MICHELIN
              ? `bg-slate-900 text-amber-400 ${getGlow(ChefMode.MICHELIN)}`
              : 'border-transparent text-slate-500 hover:text-amber-200 hover:bg-white/5'
          }`}
        >
          <span className="text-lg">✨</span> 
          <span className="tracking-wide">{t.michelinMode}</span>
        </button>

        <button
          onClick={() => onToggle(ChefMode.HELL)}
          disabled={disabled}
          className={`relative z-10 px-6 py-3 rounded-xl text-xs md:text-sm font-medium transition-all duration-300 flex items-center gap-2 border ${
            currentMode === ChefMode.HELL
              ? `bg-slate-900 text-purple-400 ${getGlow(ChefMode.HELL)}`
              : 'border-transparent text-slate-500 hover:text-purple-200 hover:bg-white/5'
          }`}
        >
          <span className="text-lg">🔥</span> 
          <span className="tracking-wide">{t.hellMode}</span>
        </button>

        <button
          onClick={() => onToggle(ChefMode.POPULAR)}
          disabled={disabled}
          className={`relative z-10 px-6 py-3 rounded-xl text-xs md:text-sm font-medium transition-all duration-300 flex items-center gap-2 border ${
            currentMode === ChefMode.POPULAR
              ? `bg-slate-900 text-blue-400 ${getGlow(ChefMode.POPULAR)}`
              : 'border-transparent text-slate-500 hover:text-blue-200 hover:bg-white/5'
          }`}
        >
          <span className="text-lg">🌐</span> 
          <span className="tracking-wide">{t.popularMode}</span>
        </button>
      </div>
    </div>
  );
};
