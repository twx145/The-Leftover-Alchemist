
import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../translations';

interface ApiKeyConfigProps {
  onSave: (key: string) => void;
  onCancel: () => void;
  language: Language;
  hasKey: boolean;
  error?: string | null;
}

export const ApiKeyConfig: React.FC<ApiKeyConfigProps> = ({ onSave, onCancel, language, hasKey, error }) => {
  const [inputKey, setInputKey] = useState('');
  const t = translations[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim()) {
      onSave(inputKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-amber-500 blur-[20px]"></div>

        <h2 className="text-2xl font-serif font-bold text-white mb-4">
          {error ? '⚠️ ' + t.apiKeyInvalid : t.apiKeyRequired}
        </h2>
        
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          {t.apiKeyDesc}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder={t.apiKeyPlaceholder}
            className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white mb-6 focus:outline-none focus:border-amber-500 transition-colors font-mono text-sm"
          />
          
          <div className="flex gap-3">
             <button
              type="submit"
              disabled={!inputKey.trim()}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
            >
              {t.saveKey}
            </button>
            {hasKey && (
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-3 border border-white/10 hover:bg-white/5 text-slate-300 rounded-xl transition-colors font-bold text-sm"
                >
                    ✕
                </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
