
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ChefMode, Recipe, Language, DetectedIngredient } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ingredientsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the ingredient" },
          box_2d: {
            type: Type.ARRAY,
            items: { type: Type.NUMBER },
            description: "Bounding box coordinates [ymin, xmin, ymax, xmax] normalized to 0-1.",
          },
        },
        required: ["name", "box_2d"],
      },
      description: "List of ingredients with bounding boxes.",
    },
  },
  required: ["ingredients"],
};

const recipeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "The creative name of the dish.",
    },
    description: {
      type: Type.STRING,
      description: "A short, engaging description of the dish.",
    },
    ingredientsDetected: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of ingredients actually used in the recipe.",
    },
    steps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Step-by-step cooking instructions.",
    },
    cookingTime: {
      type: Type.STRING,
      description: "Estimated time to cook.",
    },
    difficulty: {
      type: Type.STRING,
      description: "Difficulty level.",
    },
    chefComment: {
      type: Type.STRING,
      description: "A specific comment from the chef or search summary.",
    }
  },
  required: ["title", "description", "ingredientsDetected", "steps", "cookingTime", "difficulty", "chefComment"],
};

const recipeListSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    recipes: {
      type: Type.ARRAY,
      items: recipeSchema,
      description: "List of 6 distinct recipes.",
    }
  },
  required: ["recipes"]
};

// Helper to clean base64 string
const cleanBase64 = (str: string) => str.split(',')[1] || str;

export const identifyIngredients = async (
  imageBase64: string,
  language: Language
): Promise<DetectedIngredient[]> => {
  const langInstruction = language === 'zh' ? "in Simplified Chinese (zh-CN)" : "in English";
  
  const prompt = `
    Identify the main edible ingredients in this image.
    Return a list of ingredients with their 2D bounding boxes.
    
    1. 'name': Common name of the ingredient ${langInstruction}.
    2. 'box_2d': [ymin, xmin, ymax, xmax] (0-1).
    
    Guidelines:
    - ACCURACY IS CRITICAL. Use advanced vision capabilities to identify ingredients precisely.
    - Group similar items: If there are multiple items of the same kind (e.g. a pile of fruits or a bag of buns), return ONE bounding box for the whole group.
    - Reduce clutter: Avoid overlapping boxes for the same object. Consolidate into single clear boxes.
    - Only identify food ingredients. Ignore background objects like shelves or fridge walls.
  `;

  try {
    // Upgraded to Pro for better vision accuracy as requested
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro", 
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: cleanBase64(imageBase64) } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: ingredientsSchema,
      },
    });

    const text = response.text;
    if (!text) return [];
    const result = JSON.parse(text);
    return result.ingredients || [];
  } catch (error) {
    console.error("Gemini Identify Ingredients Error:", error);
    throw error;
  }
};

export const generateRecipeFromImage = async (
  imageBase64: string,
  selectedIngredients: string[],
  mode: ChefMode,
  language: Language
): Promise<Recipe> => {
  const isMichelin = mode === ChefMode.MICHELIN;
  const langInstruction = language === 'zh' 
    ? "IMPORTANT: Output all text content (title, description, steps, etc.) in Simplified Chinese (zh-CN)." 
    : "IMPORTANT: Output all text content in English.";

  const ingredientsList = selectedIngredients.join(', ');

  const prompt = isMichelin
    ? `You are a world-renowned 3-star Michelin Chef.
       The user wants to cook a dish using MAINLY these ingredients found in their fridge: [${ingredientsList}].
       Analyze the provided image for context (quantity, quality) but focus on the selected ingredients.
       Create a sophisticated, high-end recipe.
       Use flowery, expensive-sounding culinary terms.
       ${langInstruction}
       Provide the output in JSON format.`
    : `You are a chaotic 'Dark Cuisine' Chef (The Hell Kitchen Alchemist). 
       The user wants to cook using these ingredients: [${ingredientsList}].
       Analyze the image for context.
       Create a bizarre, creative, perhaps slightly questionable but technically edible recipe.
       Be dramatic, funny, and unconventional.
       ${langInstruction}
       Provide the output in JSON format.`;

  try {
    // Keep Pro for high quality generation
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: cleanBase64(imageBase64) } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
        temperature: 0.8,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini.");

    const recipe = JSON.parse(text) as Recipe;
    // Add client-side ID and timestamp
    recipe.id = crypto.randomUUID();
    recipe.timestamp = Date.now();
    recipe.comments = [];
    recipe.isFavorite = false;
    
    return recipe;
  } catch (error) {
    console.error("Gemini Recipe Generation Error:", error);
    throw error;
  }
};

export const searchPopularRecipes = async (
  selectedIngredients: string[],
  language: Language
): Promise<Recipe[]> => {
  const langInstruction = language === 'zh' 
    ? "IMPORTANT: Output all text content in Simplified Chinese (zh-CN)." 
    : "IMPORTANT: Output all text content in English.";

  const ingredientsList = selectedIngredients.join(', ');

  const prompt = `
    Act as a search engine and recipe aggregator.
    Find 4 DISTINCT, POPULAR, and PRACTICAL recipes that can be made primarily with these ingredients: [${ingredientsList}].
    These should be normal, real-world recipes that people actually cook.
    For each recipe, provide detailed steps, cooking time, and difficulty.
    In the 'chefComment' field, provide a brief sentence about why this recipe is popular.
    ${langInstruction}
    Provide the output in JSON format as a list of 4 recipes.
  `;

  try {
    // Use Flash for speed in search/aggregation
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: recipeListSchema,
        temperature: 0.4,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini.");

    const result = JSON.parse(text);
    return (result.recipes || []).map((r: any) => ({
      ...r,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      comments: [],
      isFavorite: false
    }));
  } catch (error) {
    console.error("Gemini Recipe Search Error:", error);
    throw error;
  }
};
