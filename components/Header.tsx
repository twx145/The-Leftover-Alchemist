
import React from 'react';
import { Language, ViewState } from '../types';
import { translations } from '../translations';

interface HeaderProps {
  language: Language;
  onToggleLanguage: () => void;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export const Header: React.FC<HeaderProps> = ({ language, onToggleLanguage, currentView, onChangeView }) => {
  const t = translations[language];

  return (
    <header className="py-8 px-4 flex flex-col items-center relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-32 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none"></div>

      <div className="absolute top-6 right-6 z-50 flex gap-3">
        <button 
          onClick={onToggleLanguage}
          className="text-[10px] font-bold tracking-[0.2em] px-3 py-1.5 rounded border border-white/10 hover:border-amber-500/50 text-slate-400 hover:text-amber-400 transition-all uppercase bg-black/20 backdrop-blur-md"
        >
          {language === 'en' ? 'CN / 简' : 'EN / US'}
        </button>
      </div>

      <div className="relative z-10 text-center mb-8">
        <h1 className="text-5xl md:text-7xl font-serif font-medium text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-200 to-amber-500 tracking-tight mb-2 drop-shadow-lg animate-float">
          {t.appTitle}
        </h1>
        <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mb-3"></div>
        <p className="text-slate-400 font-light text-xs md:text-sm tracking-[0.3em] uppercase">
          {t.appSubtitle}
        </p>
      </div>

      {/* Modern Glass Navigation */}
      <div className="relative z-20 inline-flex p-1.5 rounded-full glass-panel shadow-2xl">
         {['home', 'history', 'favorites'].map((view) => (
           <button
              key={view}
              onClick={() => onChangeView(view as ViewState)}
              className={`relative px-6 py-2 rounded-full text-xs font-bold tracking-widest transition-all duration-500 uppercase ${
                currentView === view 
                ? 'text-black' 
                : 'text-slate-400 hover:text-white'
              }`}
           >
              {currentView === view && (
                <div className="absolute inset-0 bg-gradient-to-r from-amber-200 to-amber-400 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.4)] animate-scale-in"></div>
              )}
              <span className="relative z-10">{t[view as keyof typeof t]}</span>
           </button>
         ))}
      </div>
    </header>
  );
};
