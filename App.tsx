
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ModeToggle } from './components/ModeToggle';
import { ImageUpload } from './components/ImageUpload';
import { RecipeCard } from './components/RecipeCard';
import { RecipeList } from './components/RecipeList';
import { IngredientSelector } from './components/IngredientSelector';
import { RecipeHistory } from './components/RecipeHistory';
import { identifyIngredients, generateRecipeFromImage, searchPopularRecipes } from './services/geminiService';
import { AppState, ChefMode, Language, Recipe, ViewState, Comment } from './types';
import { translations } from './translations';

export const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    image: null,
    imagePreview: null,
    mode: ChefMode.MICHELIN,
    language: 'en',
    status: 'idle',
    detectedIngredients: [],
    recipes: [],
    selectedRecipeIndex: -1,
    error: null,
    view: 'home',
    history: [],
    favorites: []
  });

  useEffect(() => {
    const savedHistory = localStorage.getItem('recipe_history');
    const savedFavorites = localStorage.getItem('recipe_favorites');
    
    setState(prev => ({
        ...prev,
        history: savedHistory ? JSON.parse(savedHistory) : [],
        favorites: savedFavorites ? JSON.parse(savedFavorites) : []
    }));
  }, []);

  useEffect(() => {
    localStorage.setItem('recipe_history', JSON.stringify(state.history));
    localStorage.setItem('recipe_favorites', JSON.stringify(state.favorites));
  }, [state.history, state.favorites]);

  const t = translations[state.language];

  const handleModeToggle = (mode: ChefMode) => {
    setState(prev => ({ ...prev, mode }));
  };
  
  const handleLanguageToggle = () => {
    setState(prev => ({
        ...prev,
        language: prev.language === 'en' ? 'zh' : 'en'
    }));
  };

  const handleImageSelected = async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      
      setState(prev => ({
        ...prev,
        image: file,
        imagePreview: base64String,
        status: 'analyzing_image',
        error: null
      }));

      processIdentification(base64String, state.language);
    };
    reader.readAsDataURL(file);
  };

  const handleRescan = () => {
      if (state.imagePreview) {
          setState(prev => ({ ...prev, status: 'analyzing_image', error: null }));
          processIdentification(state.imagePreview, state.language);
      }
  };

  const processIdentification = async (base64: string, language: Language) => {
    try {
      const ingredients = await identifyIngredients(base64, language);
      setState(prev => ({
        ...prev,
        status: 'selecting_ingredients',
        detectedIngredients: ingredients
      }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: translations[language].errorDesc
      }));
    }
  };

  const addToHistory = (recipes: Recipe[]) => {
      setState(prev => {
          const newHistory = [...recipes, ...prev.history].slice(0, 50); 
          return { ...prev, history: newHistory };
      });
  };

  const handleIngredientsConfirmed = async (selectedIngredients: string[]) => {
    if (!state.imagePreview) return;

    if (state.mode === ChefMode.POPULAR) {
        handleSearchRecipes(selectedIngredients);
        return;
    }

    setState(prev => ({
      ...prev,
      status: 'cooking',
      error: null,
      recipes: [],
      selectedRecipeIndex: 0
    }));

    try {
      const recipe = await generateRecipeFromImage(
        state.imagePreview, 
        selectedIngredients, 
        state.mode, 
        state.language
      );
      
      addToHistory([recipe]);

      setState(prev => ({
        ...prev,
        status: 'success',
        recipes: [recipe],
        selectedRecipeIndex: 0
      }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: translations[state.language].errorDesc
      }));
    }
  };

  const handleSearchRecipes = async (selectedIngredients: string[]) => {
    setState(prev => ({
        ...prev,
        status: 'cooking', 
        error: null,
        recipes: [],
        selectedRecipeIndex: -1
    }));

    try {
        const recipes = await searchPopularRecipes(selectedIngredients, state.language);
        addToHistory(recipes);
        setState(prev => ({
            ...prev,
            status: 'success',
            recipes: recipes,
            selectedRecipeIndex: -1 
        }));
    } catch (err: any) {
        console.error(err);
        setState(prev => ({
            ...prev,
            status: 'error',
            error: translations[state.language].errorDesc
        }));
    }
  };

  const handleReset = () => {
    setState(prev => ({
      ...prev,
      image: null,
      imagePreview: null,
      status: 'idle',
      detectedIngredients: [],
      recipes: [],
      selectedRecipeIndex: -1,
      error: null,
      view: 'home'
    }));
  };

  const handleBackToResults = () => {
    setState(prev => ({
        ...prev,
        selectedRecipeIndex: -1
    }));
  };

  const handleBackToHome = () => {
      setState(prev => ({
          ...prev,
          view: 'home'
      }));
  };

  const updateRecipeInState = (id: string, updater: (r: Recipe) => Recipe) => {
      setState(prev => ({
          ...prev,
          recipes: prev.recipes.map(r => r.id === id ? updater(r) : r),
          history: prev.history.map(r => r.id === id ? updater(r) : r),
          favorites: prev.favorites.map(r => r.id === id ? updater(r) : r)
      }));
  };

  const handleToggleFavorite = (id: string) => {
    setState(prev => {
        const allContexts = [...prev.recipes, ...prev.history, ...prev.favorites];
        const target = allContexts.find(r => r.id === id);
        
        if (!target) return prev;

        const isCurrentlyFav = prev.favorites.some(r => r.id === id);
        let newFavorites = [...prev.favorites];
        
        if (isCurrentlyFav) {
            newFavorites = newFavorites.filter(r => r.id !== id);
        } else {
            newFavorites = [{ ...target, isFavorite: true }, ...newFavorites];
        }

        const updater = (r: Recipe) => r.id === id ? { ...r, isFavorite: !isCurrentlyFav } : r;

        return {
            ...prev,
            favorites: newFavorites,
            history: prev.history.map(updater),
            recipes: prev.recipes.map(updater)
        };
    });
  };

  const handleAddComment = (id: string, text: string) => {
      const newComment: Comment = {
          id: crypto.randomUUID(),
          text,
          timestamp: Date.now()
      };
      updateRecipeInState(id, r => ({ ...r, comments: [newComment, ...(r.comments || [])] }));
  };

  const handleRateRecipe = (id: string, rating: number) => {
      updateRecipeInState(id, r => ({ ...r, rating }));
  };

  const handleAddTag = (id: string, tag: string) => {
      updateRecipeInState(id, r => {
          const tags = r.tags || [];
          if (tags.includes(tag)) return r;
          return { ...r, tags: [...tags, tag] };
      });
  };

  const handleRemoveTag = (id: string, tagToRemove: string) => {
      updateRecipeInState(id, r => ({
          ...r,
          tags: (r.tags || []).filter(t => t !== tagToRemove)
      }));
  };

  const handleViewRecipeFromHistory = (recipe: Recipe) => {
      setState(prev => ({
          ...prev,
          view: 'home',
          status: 'success',
          recipes: [recipe],
          selectedRecipeIndex: 0,
          imagePreview: null 
      }));
  };

  const LoadingView = ({ title, subtitle }: { title: string, subtitle: string }) => {
      const isMichelin = state.mode === ChefMode.MICHELIN;
      const glowColor = isMichelin ? 'bg-amber-500' : (state.mode === ChefMode.POPULAR ? 'bg-blue-500' : 'bg-purple-600');
      const textColor = isMichelin ? 'text-amber-400' : (state.mode === ChefMode.POPULAR ? 'text-blue-400' : 'text-purple-400');

      return (
        <div className="flex flex-col items-center justify-center pt-24 animate-pulse">
            <div className="relative w-40 h-40 mb-10 flex items-center justify-center">
                {/* Outer Glow Ring */}
                <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 ${glowColor}`}></div>
                
                {/* Spinning Rings */}
                <div className={`absolute inset-0 border-t-2 border-b-2 ${textColor} rounded-full animate-spin`} style={{ animationDuration: '3s' }}></div>
                <div className={`absolute inset-4 border-l-2 border-r-2 ${textColor} rounded-full animate-spin opacity-60`} style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
                <div className={`absolute inset-8 border-t-2 ${textColor} rounded-full animate-spin opacity-40`} style={{ animationDuration: '1s' }}></div>
                
                {/* Core */}
                <div className={`w-4 h-4 rounded-full ${glowColor} shadow-[0_0_20px_currentColor]`}></div>
            </div>
            <h3 className={`text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-3`}>{title}</h3>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${glowColor} animate-bounce`}></div>
                <div className={`w-2 h-2 rounded-full ${glowColor} animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
                <div className={`w-2 h-2 rounded-full ${glowColor} animate-bounce`} style={{ animationDelay: '0.4s' }}></div>
            </div>
            <p className="text-slate-500 mt-2 font-mono text-sm uppercase tracking-widest">{subtitle}</p>
        </div>
      );
  };

  return (
    <div className="min-h-screen pb-20 font-sans selection:bg-amber-500/30">
      
      <Header 
        language={state.language} 
        onToggleLanguage={handleLanguageToggle}
        currentView={state.view}
        onChangeView={(view) => setState(prev => ({ ...prev, view }))}
      />
      
      <main className="container mx-auto px-4 max-w-7xl">

        {state.view === 'favorites' && (
            <RecipeHistory 
                title={t.favorites}
                recipes={state.favorites}
                onSelectRecipe={handleViewRecipeFromHistory}
                language={state.language}
                onBack={handleBackToHome}
            />
        )}

        {state.view === 'history' && (
            <RecipeHistory 
                title={t.history}
                recipes={state.history}
                onSelectRecipe={handleViewRecipeFromHistory}
                language={state.language}
                onBack={handleBackToHome}
            />
        )}
        
        {state.view === 'home' && (
            <>
                {state.status === 'idle' && (
                <div className="animate-fade-in-up">
                    <ModeToggle 
                        currentMode={state.mode} 
                        onToggle={handleModeToggle} 
                        disabled={false}
                        language={state.language}
                    />
                    <div className="max-w-xl mx-auto text-center mb-10">
                        <p className="text-slate-400 text-lg font-light leading-relaxed">
                            {t.introText}
                        </p>
                    </div>
                    <ImageUpload 
                        onImageSelected={handleImageSelected} 
                        disabled={false}
                        language={state.language}
                    />
                </div>
                )}

                {state.status === 'analyzing_image' && (
                <LoadingView 
                    title={state.mode === ChefMode.MICHELIN ? t.analyzingMichelin : (state.mode === ChefMode.POPULAR ? t.analyzingPopular : t.analyzingHell)}
                    subtitle={t.analyzingSub}
                />
                )}

                {state.status === 'selecting_ingredients' && (
                <IngredientSelector 
                    detectedIngredients={state.detectedIngredients}
                    imagePreview={state.imagePreview}
                    onConfirm={handleIngredientsConfirmed}
                    onSearchRecipes={handleSearchRecipes}
                    onCancel={handleReset}
                    onRescan={handleRescan}
                    language={state.language}
                    mode={state.mode}
                />
                )}

                {state.status === 'cooking' && (
                <LoadingView 
                    title={state.mode === ChefMode.MICHELIN ? t.analyzingMichelin : (state.mode === ChefMode.POPULAR ? t.analyzingPopular : t.analyzingHell)}
                    subtitle={state.recipes.length === 0 ? t.cookingSub : t.searchingSub}
                />
                )}

                {state.status === 'error' && (
                <div className="max-w-md mx-auto text-center pt-24 animate-fade-in glass-panel p-8 rounded-2xl">
                    <div className="text-6xl mb-6">💥</div>
                    <h3 className="text-2xl font-bold text-white mb-2">{t.errorTitle}</h3>
                    <p className="text-red-400 mb-8">{state.error}</p>
                    <button 
                    onClick={handleReset}
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white font-bold tracking-widest uppercase transition-all"
                    >
                    {t.tryAgain}
                    </button>
                </div>
                )}

                {state.status === 'success' && (
                    <>
                        {state.selectedRecipeIndex === -1 && state.recipes.length > 0 && (
                            <RecipeList 
                                recipes={state.recipes}
                                onSelectRecipe={(index) => setState(prev => ({ ...prev, selectedRecipeIndex: index }))}
                                onBack={handleReset}
                                language={state.language}
                            />
                        )}

                        {state.selectedRecipeIndex !== -1 && state.recipes[state.selectedRecipeIndex] && (
                            <RecipeCard 
                                recipe={state.recipes[state.selectedRecipeIndex]} 
                                mode={state.mode}
                                imagePreview={state.imagePreview}
                                onReset={state.recipes.length > 1 ? handleBackToResults : handleReset}
                                language={state.language}
                                onToggleFavorite={handleToggleFavorite}
                                onAddComment={handleAddComment}
                                onRateRecipe={handleRateRecipe}
                                onAddTag={handleAddTag}
                                onRemoveTag={handleRemoveTag}
                                history={state.history}
                                onRecipeClick={handleViewRecipeFromHistory}
                            />
                        )}
                    </>
                )}
            </>
        )}
      </main>
    </div>
  );
};
