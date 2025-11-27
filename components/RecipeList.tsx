
import React from 'react';
import { Recipe, Language } from '../types';
import { translations } from '../translations';

interface RecipeListProps {
  recipes: Recipe[];
  onSelectRecipe: (index: number) => void;
  onBack: () => void;
  language: Language;
}

export const RecipeList: React.FC<RecipeListProps> = ({ recipes, onSelectRecipe, onBack, language }) => {
  const t = translations[language];

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-up">
      
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t.back}
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-serif font-bold text-white">{t.foundRecipesTitle}</h2>
          <p className="text-slate-400 text-sm">{t.foundRecipesSubtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recipes.map((recipe, index) => (
          <div 
            key={index}
            className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-blue-500/50 hover:bg-slate-800 transition-all cursor-pointer group flex flex-col"
            onClick={() => onSelectRecipe(index)}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/20">
                {t.popularBadge}
              </span>
              <div className="flex items-center gap-1 text-slate-400 text-xs">
                <span>⏱️ {recipe.cookingTime}</span>
              </div>
            </div>
            
            <h3 className="text-xl font-serif font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
              {recipe.title}
            </h3>
            
            <p className="text-slate-400 text-sm line-clamp-3 mb-4 flex-grow">
              {recipe.description}
            </p>

            <div className="flex gap-2 flex-wrap mb-6">
                {recipe.ingredientsDetected.slice(0, 3).map((ing, i) => (
                    <span key={i} className="text-xs bg-slate-900 px-2 py-1 rounded text-slate-500">{ing}</span>
                ))}
                {recipe.ingredientsDetected.length > 3 && (
                    <span className="text-xs bg-slate-900 px-2 py-1 rounded text-slate-500">+{recipe.ingredientsDetected.length - 3}</span>
                )}
            </div>

            <button className="w-full py-2 rounded-lg bg-slate-700 text-white font-medium text-sm group-hover:bg-blue-600 transition-colors">
              {t.viewRecipe}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
