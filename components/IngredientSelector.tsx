
import React, { useState, useMemo } from 'react';
import { Language, DetectedIngredient, ChefMode } from '../types';
import { translations } from '../translations';

interface IngredientSelectorProps {
  detectedIngredients: DetectedIngredient[];
  imagePreview: string | null;
  onConfirm: (selected: string[]) => void;
  onSearchRecipes: (selected: string[]) => void;
  onCancel: () => void;
  onRescan: () => void;
  language: Language;
  mode: ChefMode;
}

export const IngredientSelector: React.FC<IngredientSelectorProps> = ({ 
  detectedIngredients, 
  imagePreview,
  onConfirm, 
  onSearchRecipes,
  onCancel,
  onRescan,
  language,
  mode
}) => {
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set(detectedIngredients.map(i => i.name)));
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredIngredient, setHoveredIngredient] = useState<string | null>(null);
  
  const t = translations[language];

  // Neon palette
  const colors = ['#FBBF24', '#F472B6', '#34D399', '#60A5FA', '#A78BFA', '#E879F9', '#22D3EE', '#A3E635'];

  const toggleIngredient = (name: string) => {
    const newSelected = new Set(selectedNames);
    if (newSelected.has(name)) {
      newSelected.delete(name);
    } else {
      newSelected.add(name);
    }
    setSelectedNames(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedNames.size === detectedIngredients.length) {
      setSelectedNames(new Set());
    } else {
      setSelectedNames(new Set(detectedIngredients.map(i => i.name)));
    }
  };

  const filteredIngredients = useMemo(() => {
    return detectedIngredients.filter(ing => 
      ing.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [detectedIngredients, searchTerm]);

  const isSearchMode = mode === ChefMode.POPULAR;
  const mainAction = isSearchMode ? onSearchRecipes : onConfirm;
  const mainButtonText = isSearchMode ? t.searchRecipesButton : t.cookButton;
  
  // Dynamic glow based on mode
  const actionGlow = isSearchMode ? 'shadow-blue-500/40 border-blue-400' : 'shadow-amber-500/40 border-amber-400';
  const actionBg = isSearchMode 
      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' 
      : 'bg-gradient-to-r from-amber-500 to-orange-600 text-black';

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in-up pb-12">
      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/5">
        
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-1">{t.selectIngredientsTitle}</h2>
            <p className="text-slate-500 text-xs uppercase tracking-widest">{t.selectIngredientsSubtitle}</p>
          </div>
          
          <button 
             onClick={onRescan}
             className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
          >
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
             </svg>
             {t.rescan}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row min-h-[500px]">
          
          {/* HUD Image Area */}
          <div className="lg:w-3/5 bg-black/40 relative flex items-center justify-center p-8 overflow-hidden group">
            {/* Grid decoration */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

            {imagePreview && (
              <div className="relative shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded overflow-hidden transition-transform duration-700 hover:scale-[1.01]" style={{ width: 'fit-content', margin: '0 auto' }}>
                 <img 
                    src={imagePreview} 
                    alt="Ingredients" 
                    className="block max-w-full max-h-[60vh] w-auto h-auto opacity-90"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                 
                 {detectedIngredients.map((ing, index) => {
                    if (!ing.box_2d) return null;
                    let [ymin, xmin, ymax, xmax] = ing.box_2d;
                    if (ymin > ymax) [ymin, ymax] = [ymax, ymin];
                    if (xmin > xmax) [xmin, xmax] = [xmax, xmin];

                    const isSelected = selectedNames.has(ing.name);
                    const isHovered = hoveredIngredient === ing.name;
                    const color = colors[index % colors.length];

                    return (
                        <div
                            key={`box-${index}`}
                            onMouseEnter={() => setHoveredIngredient(ing.name)}
                            onMouseLeave={() => setHoveredIngredient(null)}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleIngredient(ing.name);
                            }}
                            className={`absolute cursor-pointer transition-all duration-300 ${isSelected ? 'z-20' : 'z-10'}`}
                            style={{
                                top: `${ymin * 100}%`,
                                left: `${xmin * 100}%`,
                                height: `${(ymax - ymin) * 100}%`,
                                width: `${(xmax - xmin) * 100}%`,
                            }}
                        >
                            {/* Technical Corners UI */}
                            <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 transition-colors duration-300 ${isSelected || isHovered ? 'border-white' : 'border-white/50'}`} style={{ borderColor: isSelected ? color : undefined }}></div>
                            <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 transition-colors duration-300 ${isSelected || isHovered ? 'border-white' : 'border-white/50'}`} style={{ borderColor: isSelected ? color : undefined }}></div>
                            <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 transition-colors duration-300 ${isSelected || isHovered ? 'border-white' : 'border-white/50'}`} style={{ borderColor: isSelected ? color : undefined }}></div>
                            <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 transition-colors duration-300 ${isSelected || isHovered ? 'border-white' : 'border-white/50'}`} style={{ borderColor: isSelected ? color : undefined }}></div>

                            {/* Center Highlight */}
                            <div 
                                className={`absolute inset-0 transition-opacity duration-300 ${isSelected ? 'opacity-20' : (isHovered ? 'opacity-10' : 'opacity-0')}`}
                                style={{ backgroundColor: color }}
                            ></div>

                            {(isHovered || isSelected) && (
                                <div 
                                    className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur border border-white/20 px-3 py-1 text-xs font-mono text-white shadow-xl flex flex-col items-center min-w-max z-50"
                                >
                                    <span className="text-[10px] text-slate-400 tracking-tighter">DETECTED_OBJ_{index}</span>
                                    <span className="font-bold text-sm" style={{ color: color }}>{ing.name.toUpperCase()}</span>
                                    <div className="w-1 h-3 bg-white/20 absolute -bottom-3 left-1/2 -translate-x-1/2"></div>
                                </div>
                            )}
                        </div>
                    );
                 })}
              </div>
            )}
          </div>

          {/* List Area */}
          <div className="lg:w-2/5 p-6 md:p-8 flex flex-col h-full border-l border-white/5 bg-slate-900/40 backdrop-blur-md">
             
             <div className="mb-6 relative group">
                <input 
                    type="text" 
                    placeholder={t.searchIngredientsPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-12 text-slate-200 focus:outline-none focus:border-amber-500/50 transition-all text-sm tracking-wide placeholder-slate-600 focus:bg-black/60"
                />
                <svg className="w-5 h-5 text-slate-500 absolute left-4 top-4 transition-colors group-focus-within:text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
             </div>

             <div className="flex justify-between items-center mb-4 px-1">
               <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                  Items: <span className="text-white">{filteredIngredients.length}</span>
               </span>
               <button 
                 onClick={handleSelectAll}
                 className="text-[10px] text-amber-500 hover:text-amber-300 font-bold uppercase tracking-widest border border-amber-500/30 px-2 py-1 rounded hover:bg-amber-500/10 transition-colors"
               >
                 [{t.selectAll}]
               </button>
             </div>

             <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-6 max-h-[400px] scrollbar-thin">
                {filteredIngredients.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600">
                        <span className="text-2xl mb-2 opacity-20">∅</span>
                        <p className="text-sm font-mono">{t.noIngredientsFound}</p>
                    </div>
                ) : (
                    filteredIngredients.map((ing, index) => {
                        const isSelected = selectedNames.has(ing.name);
                        const isHovered = hoveredIngredient === ing.name;
                        const color = colors[index % colors.length];
                        return (
                          <button
                            key={ing.name}
                            onMouseEnter={() => setHoveredIngredient(ing.name)}
                            onMouseLeave={() => setHoveredIngredient(null)}
                            onClick={() => toggleIngredient(ing.name)}
                            className={`
                              w-full px-4 py-3 rounded-r-xl border-l-4 text-left transition-all duration-200
                              flex items-center justify-between group relative overflow-hidden
                              ${isSelected 
                                ? 'bg-white/10 border-l-amber-500 pl-6' 
                                : (isHovered ? 'bg-white/5 border-l-slate-500' : 'bg-transparent border-l-slate-800 hover:bg-white/5 text-slate-400')}
                            `}
                            style={{ borderColor: isSelected ? color : undefined }}
                          >
                            <span className={`text-sm font-medium tracking-wide ${isSelected ? 'text-white' : ''}`}>
                                {ing.name}
                            </span>
                            
                            {/* Tech deco */}
                            <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-mono text-slate-600 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                                    CONFIRMED
                                </span>
                                <div className={`w-2 h-2 rounded-full shadow-[0_0_5px_currentColor] transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} style={{ color: color, backgroundColor: color }}></div>
                            </div>
                          </button>
                        );
                    })
                )}
             </div>

             <div className="flex flex-col gap-4 mt-auto pt-6 border-t border-white/5">
                <button
                    onClick={() => mainAction(Array.from(selectedNames))}
                    disabled={selectedNames.size === 0}
                    className={`
                    w-full py-4 px-6 rounded-xl font-bold tracking-widest text-sm uppercase transition-all 
                    flex items-center justify-center gap-3 border
                    ${selectedNames.size > 0 
                        ? `${actionBg} ${actionGlow} hover:scale-[1.02] hover:shadow-[0_0_20px_currentColor]`
                        : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'}
                    `}
                >
                    {t.cookButton === mainButtonText && <span className="text-lg">⚡</span>} 
                    {mainButtonText}
                </button>
                
                <button
                    onClick={onCancel}
                    className="w-full py-3 px-6 rounded-xl text-slate-400 hover:text-white transition-colors text-xs uppercase tracking-widest hover:bg-white/5"
                >
                    {t.back}
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};