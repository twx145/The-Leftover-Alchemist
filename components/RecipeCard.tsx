
import React, { useState, useEffect } from 'react';
import { Recipe, ChefMode, Language, Comment } from '../types';
import { translations } from '../translations';

interface RecipeCardProps {
  recipe: Recipe;
  mode: ChefMode;
  imagePreview: string | null;
  onReset: () => void;
  language: Language;
  onToggleFavorite: (id: string) => void;
  onAddComment: (id: string, text: string) => void;
  onRateRecipe: (id: string, rating: number) => void;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
  history: Recipe[];
  onRecipeClick: (recipe: Recipe) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ 
  recipe, 
  mode, 
  imagePreview, 
  onReset, 
  language,
  onToggleFavorite,
  onAddComment,
  onRateRecipe,
  onAddTag,
  onRemoveTag,
  history,
  onRecipeClick
}) => {
  const isMichelin = mode === ChefMode.MICHELIN;
  const isPopular = mode === ChefMode.POPULAR;
  
  const [commentText, setCommentText] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [suggestions, setSuggestions] = useState<Recipe[]>([]);
  const t = translations[language];
  
  useEffect(() => {
    if (history.length > 0) {
        const otherRecipes = history.filter(r => r.id !== recipe.id);
        const shuffled = [...otherRecipes].sort(() => 0.5 - Math.random());
        setSuggestions(shuffled.slice(0, 2));
    }
  }, [history, recipe.id]);

  let theme = {
      primary: 'text-amber-400',
      gradient: 'from-amber-200 via-yellow-400 to-amber-600',
      glow: 'shadow-amber-500/20',
      border: 'border-amber-500/20',
      badge: 'bg-amber-500 text-black',
      bgGradient: 'bg-gradient-to-b from-slate-900 via-slate-900 to-amber-900/20'
  };

  if (isPopular) {
      theme = {
          primary: 'text-blue-400',
          gradient: 'from-cyan-300 via-blue-400 to-blue-600',
          glow: 'shadow-blue-500/20',
          border: 'border-blue-500/20',
          badge: 'bg-blue-500 text-white',
          bgGradient: 'bg-gradient-to-b from-slate-900 via-slate-900 to-blue-900/20'
      };
  } else if (!isMichelin && !isPopular) { // Hell
      theme = {
          primary: 'text-purple-400',
          gradient: 'from-fuchsia-300 via-purple-400 to-violet-600',
          glow: 'shadow-purple-500/20',
          border: 'border-purple-500/20',
          badge: 'bg-purple-600 text-white',
          bgGradient: 'bg-gradient-to-b from-slate-900 via-slate-900 to-purple-900/20'
      };
  }

  const animateDelay = (ms: number) => ({ animationDelay: `${ms}ms`, animationFillMode: 'forwards' });
  const fadeInUp = "opacity-0 animate-fade-in-up";

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(recipe.id, commentText);
      setCommentText('');
    }
  };

  const handleAddTagSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (tagInput.trim()) {
          onAddTag(recipe.id, tagInput.trim());
          setTagInput('');
      }
  };

  const handleShare = () => {
    const text = `${recipe.title}\n\n${recipe.description}\n\nIngredients: ${recipe.ingredientsDetected.join(', ')}\n\nSteps:\n${recipe.steps.join('\n')}`;
    navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`w-full max-w-3xl mx-auto glass-panel rounded-[2rem] overflow-hidden shadow-2xl animate-scale-in mb-16 border ${theme.border}`}>
      
      {/* Hero Image Section with Overlay */}
      <div className="relative h-80 md:h-96 overflow-hidden group">
        {imagePreview ? (
           <>
               <div className="absolute inset-0 bg-slate-900 opacity-20 group-hover:opacity-10 transition-opacity duration-700 z-10"></div>
               <img 
                 src={imagePreview} 
                 alt="Dish" 
                 className="w-full h-full object-cover transition-transform duration-[3s] ease-in-out group-hover:scale-110" 
               />
           </>
        ) : (
           <div className={`w-full h-full bg-slate-800 opacity-60`}></div>
        )}
        
        {/* Cinematic Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent z-20"></div>
        
        {/* Floating Actions */}
        <div className="absolute top-6 right-6 flex gap-3 z-30">
            <button 
                onClick={(e) => { e.stopPropagation(); handleShare(); }}
                className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all active:scale-95 text-white/80 hover:text-white"
                title={t.share}
            >
                {copied && <span className="absolute -bottom-8 right-0 text-[10px] bg-green-500 text-black px-2 py-1 rounded font-bold whitespace-nowrap">COPIED</span>}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </button>

            <button 
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(recipe.id); }}
                className={`p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all active:scale-95 ${recipe.isFavorite ? 'text-red-500' : 'text-white/80'}`}
            >
                <svg className={`w-5 h-5 ${recipe.isFavorite ? 'fill-current' : ''}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </button>
        </div>

        {/* Title Block */}
        <div className={`absolute bottom-0 left-0 p-8 md:p-10 w-full z-30 ${fadeInUp}`} style={animateDelay(100)}>
            <div className={`inline-block px-4 py-1.5 rounded-sm text-[10px] font-black tracking-[0.2em] uppercase mb-4 shadow-lg ${theme.badge}`}>
                {isMichelin ? t.michelinBadge : (isPopular ? t.popularBadge : t.hellBadge)}
            </div>
            <h2 className={`text-4xl md:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r ${theme.gradient} leading-none mb-2 drop-shadow-sm`}>
                {recipe.title}
            </h2>
            
            {/* Rating Stars */}
            <div className="flex items-center gap-1 mt-3">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => onRateRecipe(recipe.id, star)} className="group/star">
                        <svg className={`w-5 h-5 ${recipe.rating && recipe.rating >= star ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]' : 'text-white/20 group-hover/star:text-white/50'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className={`p-8 md:p-10 space-y-10 relative ${theme.bgGradient}`}>
        
        {/* Intro Section */}
        <div className={`space-y-6 ${fadeInUp}`} style={animateDelay(200)}>
          <p className="text-slate-200 font-serif text-xl md:text-2xl leading-relaxed italic border-l-2 pl-6 border-white/20">
            "{recipe.description}"
          </p>
          
          <div className="bg-white/5 border border-white/10 p-5 rounded-xl backdrop-blur-sm flex gap-4">
             <div className="text-3xl pt-1">{isMichelin ? '👨‍🍳' : (isPopular ? '🌐' : '🧙‍♂️')}</div>
             <div>
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${theme.primary}`}>{t.chefNote}</p>
                <p className="text-slate-300 text-sm leading-relaxed">{recipe.chefComment}</p>
             </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className={`grid grid-cols-2 gap-4 ${fadeInUp}`} style={animateDelay(300)}>
            <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{t.time}</p>
                <p className="text-white font-mono font-bold text-lg">{recipe.cookingTime}</p>
            </div>
            <div className="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{t.difficulty}</p>
                <p className="text-white font-mono font-bold text-lg">{recipe.difficulty}</p>
            </div>
        </div>

        {/* Tags */}
        <div className={`${fadeInUp} flex flex-wrap items-center gap-2`} style={animateDelay(350)}>
             {recipe.tags && recipe.tags.map((tag, i) => (
                 <span key={i} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center gap-2">
                     #{tag}
                     <button onClick={() => onRemoveTag(recipe.id, tag)} className="hover:text-red-400">×</button>
                 </span>
             ))}
             <form onSubmit={handleAddTagSubmit} className="flex-1 min-w-[120px]">
                <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder={t.addTagPlaceholder} className="bg-transparent border-b border-white/10 text-xs text-slate-400 py-1 w-full focus:outline-none focus:border-amber-500 transition-colors" />
             </form>
        </div>

        {/* Ingredients */}
        <div className={`${fadeInUp}`} style={animateDelay(400)}>
           <h3 className={`text-2xl font-serif font-bold ${theme.primary} mb-6 flex items-center gap-3`}>
               <span className="w-8 h-[1px] bg-current opacity-50"></span> {t.elements}
           </h3>
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
             {recipe.ingredientsDetected.map((ing, i) => (
               <div key={i} className="px-4 py-3 rounded-lg bg-white/5 border border-white/5 text-slate-200 text-sm font-medium flex items-center gap-2 hover:bg-white/10 transition-colors">
                 <span className={`w-1.5 h-1.5 rounded-full ${isMichelin ? 'bg-amber-400' : 'bg-white/50'}`}></span>
                 {ing}
               </div>
             ))}
           </div>
        </div>

        {/* Steps */}
        <div className={`${fadeInUp}`} style={animateDelay(500)}>
           <h3 className={`text-2xl font-serif font-bold ${theme.primary} mb-6 flex items-center gap-3`}>
               <span className="w-8 h-[1px] bg-current opacity-50"></span> {t.process}
           </h3>
           <div className="space-y-6 relative">
             <div className="absolute left-[19px] top-4 bottom-4 w-[1px] bg-gradient-to-b from-white/20 to-transparent"></div>
             {recipe.steps.map((step, i) => (
               <div key={i} className="flex gap-6 group relative">
                 <span className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold font-mono text-sm transition-all border-2 ${theme.border} bg-[#0F1115] text-white shadow-lg group-hover:scale-110 group-hover:border-white/40`}>
                   {i + 1}
                 </span>
                 <p className="text-slate-300 mt-2 leading-relaxed text-lg font-light">{step}</p>
               </div>
             ))}
           </div>
        </div>

        {/* Comments & Social */}
        <div className={`pt-8 border-t border-white/5 ${fadeInUp}`} style={animateDelay(600)}>
            <div className="bg-black/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">{t.comments}</h3>
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto scrollbar-thin">
                    {recipe.comments && recipe.comments.length > 0 ? (
                        recipe.comments.map((c) => (
                            <div key={c.id} className="text-sm bg-white/5 p-3 rounded-lg border border-white/5">
                                <p className="text-slate-300">{c.text}</p>
                                <p className="text-[10px] text-slate-600 mt-1 text-right">{new Date(c.timestamp).toLocaleDateString()}</p>
                            </div>
                        ))
                    ) : <p className="text-slate-600 text-sm italic">{t.noComments}</p>}
                </div>
                <form onSubmit={handlePostComment} className="flex gap-2">
                    <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={t.addComment} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-white/30" />
                    <button type="submit" disabled={!commentText.trim()} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50">{t.post}</button>
                </form>
            </div>
        </div>

        {/* Footer Actions */}
        <div className={`pt-6 ${fadeInUp}`} style={animateDelay(700)}>
          <button 
            onClick={onReset}
            className={`w-full py-4 rounded-xl font-black tracking-widest uppercase transition-all hover:scale-[1.01] active:scale-95 text-sm shadow-xl flex items-center justify-center gap-2 ${isMichelin ? 'bg-amber-500 text-black hover:bg-amber-400' : (isPopular ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-purple-600 text-white hover:bg-purple-500')}`}
          >
            <span>↺</span> {t.cookAnother}
          </button>
        </div>

      </div>
    </div>
  );
};