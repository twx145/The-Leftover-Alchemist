
export enum ChefMode {
  MICHELIN = 'MICHELIN',
  HELL = 'HELL',
  POPULAR = 'POPULAR'
}

export type Language = 'en' | 'zh';

export interface Comment {
  id: string;
  text: string;
  timestamp: number;
}

export interface Recipe {
  id: string; // Unique ID
  timestamp: number;
  title: string;
  description: string;
  ingredientsDetected: string[];
  steps: string[];
  cookingTime: string;
  difficulty: string;
  chefComment: string;
  isFavorite?: boolean;
  comments?: Comment[];
  rating?: number;
  tags?: string[];
}

export interface DetectedIngredient {
  name: string;
  box_2d?: [number, number, number, number]; // ymin, xmin, ymax, xmax (normalized 0-1)
}

export type ViewState = 'home' | 'history' | 'favorites';

export interface AppState {
  image: File | null;
  imagePreview: string | null;
  mode: ChefMode;
  language: Language;
  status: 'idle' | 'analyzing_image' | 'selecting_ingredients' | 'cooking' | 'success' | 'error';
  detectedIngredients: DetectedIngredient[];
  recipes: Recipe[];
  selectedRecipeIndex: number;
  error: string | null;
  view: ViewState;
  history: Recipe[];
  favorites: Recipe[];
}
