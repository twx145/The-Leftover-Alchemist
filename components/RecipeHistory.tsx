
import React, { useState, useMemo } from 'react';
import { Recipe, Language } from '../types';
import { translations } from '../translations';

interface RecipeHistoryProps {
  title: string;
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  language: Language;
  onDelete?: (id: string) => void;
  onBack: () => void;
}

export const RecipeHistory: React.FC<RecipeHistoryProps> = ({ title, recipes, onSelectRecipe, language, onDelete, onBack }) => {
  const t = translations[language];
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    recipes.forEach(r => r.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    if (!selectedTag) return recipes;
    return recipes.filter(r => r.tags?.includes(selectedTag));
  }, [recipes, selectedTag]);

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in-up pb-20">
      
      {/* Header with Back Button */}
      <div className="flex items-center justify-between px-4 mb-6 mt-4">
        <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t.backToHome}
        </button>
      </div>

      <h2 className="text-3xl font-serif font-bold text-white mb-6 px-4">{title}</h2>
      
      {/* Tag Filter Bar */}
      {allTags.length > 0 && (
          <div className="px-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex gap-2">
                  <button
                      onClick={() => setSelectedTag(null)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap
                        ${selectedTag === null ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}
                      `}
                  >
                      {t.all}
                  </button>
                  {allTags.map(tag => (
                      <button
                          key={tag}
                          onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap
                            ${tag === selectedTag ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}
                          `}
                      >
                          {tag}
                      </button>
                  ))}
              </div>
          </div>
      )}

      {/* Empty State */}
      {recipes.length === 0 ? (
          <div className="text-center py-20 px-4">
              <div className="text-6xl mb-4 text-slate-700">📜</div>
              <p className="text-slate-600">
                  {title === t.favorites ? t.emptyFavorites : t.emptyHistory}
              </p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
            {filteredRecipes.map((recipe) => (
              <div 
                key={recipe.id}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-amber-500/30 hover:bg-slate-800 transition-all cursor-pointer group relative flex flex-col"
                onClick={() => onSelectRecipe(recipe)}
              >
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-slate-500">
                        {new Date(recipe.timestamp).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                        {recipe.rating && (
                            <span className="flex items-center text-xs text-yellow-500">
                                <svg className="w-3 h-3 mr-1 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                {recipe.rating}
                            </span>
                        )}
                        {recipe.isFavorite && (
                            <span className="text-red-500">❤️</span>
                        )}
                    </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-200 group-hover:text-amber-400 transition-colors mb-2">
                  {recipe.title}
                </h3>
                
                <p className="text-slate-400 text-sm line-clamp-2 mb-4 flex-grow">
                  {recipe.description}
                </p>

                <div className="mt-auto pt-4 border-t border-slate-700/50 flex flex-wrap gap-2">
                     <span className="text-xs px-2 py-1 bg-slate-900 rounded text-slate-500">
                        {recipe.ingredientsDetected.length} Ingredients
                     </span>
                     {recipe.tags && recipe.tags.map(tag => (
                         <span key={tag} className="text-xs px-2 py-1 bg-slate-700/50 rounded text-slate-400">
                             {tag}
                         </span>
                     ))}
                </div>
              </div>
            ))}
          </div>
      )}
    </div>
  );
};
