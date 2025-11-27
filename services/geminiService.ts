
import { ChefMode, Recipe, Language, DetectedIngredient } from "../types";

// HARDCODED API KEY AS REQUESTED FOR TESTING
const API_KEY = "sk-DbrO8aYhoUyHCutadV662KlOSA7agS9u9Icr4FeRFgXuWCfF";
const BASE_URL = "https://www.chataiapi.com/v1";
// Using gpt-4o as it is the standard for high-quality vision analysis in OpenAI-compatible APIs
const MODEL_NAME = "gpt-4o"; 

// Helper function to call the custom API
async function callChatApi(messages: any[], responseSchemaDescription: string) {
  if (!API_KEY) {
    throw new Error("API_KEY is missing.");
  }

  const systemMessage = {
    role: "system",
    content: `You are an AI assistant capable of analyzing images and generating recipes.
    IMPORTANT: You must reply in VALID JSON format only. 
    Do not include any explanation, apologize, or use markdown code blocks (like \`\`\`json).
    Just return the raw JSON string.
    
    The expected JSON structure is:
    ${responseSchemaDescription}`
  };

  const payload = {
    model: MODEL_NAME,
    messages: [systemMessage, ...messages],
    max_tokens: 4000,
    temperature: 0.7
  };

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from API");
    }

    // Clean up markdown code blocks if the model includes them
    content = content.replace(/```json\n?/g, '').replace(/```/g, '').trim();

    try {
      return JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse JSON response:", content);
      throw new Error("Invalid JSON received from API");
    }
  } catch (error) {
    console.error("Call Chat API Error:", error);
    throw error;
  }
}

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
    - ACCURACY IS CRITICAL. Identify ingredients precisely.
    - Group similar items: If there are multiple items of the same kind return ONE bounding box for the whole group.
    - Reduce clutter: Avoid overlapping boxes for the same object.
    - Only identify food ingredients. Ignore background objects.
  `;

  const schemaDescription = `{
    "ingredients": [
      {
        "name": "string (name of ingredient)",
        "box_2d": [ymin, xmin, ymax, xmax] (numbers 0-1)
      }
    ]
  }`;

  const messages = [
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        { 
          type: "image_url", 
          image_url: { 
            url: imageBase64 
          } 
        }
      ]
    }
  ];

  try {
    const result = await callChatApi(messages, schemaDescription);
    return result.ingredients || [];
  } catch (error) {
    console.error("Identify Ingredients Error:", error);
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

  const persona = isMichelin
    ? `You are a world-renowned 3-star Michelin Chef. Use flowery, expensive-sounding culinary terms.`
    : `You are a chaotic 'Dark Cuisine' Chef (The Hell Kitchen Alchemist). Be dramatic, funny, and unconventional.`;

  const prompt = `
    ${persona}
    The user wants to cook a dish using MAINLY these ingredients found in their fridge: [${ingredientsList}].
    Analyze the provided image for context (quantity, quality) but focus on the selected ingredients.
    Create a recipe.
    ${langInstruction}
  `;

  const schemaDescription = `{
    "title": "string (creative name of the dish)",
    "description": "string (short engaging description)",
    "ingredientsDetected": ["string (ingredients used)"],
    "steps": ["string (step by step instructions)"],
    "cookingTime": "string",
    "difficulty": "string",
    "chefComment": "string (chef's specific comment)"
  }`;

  const messages = [
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        { 
          type: "image_url", 
          image_url: { 
            url: imageBase64
          } 
        }
      ]
    }
  ];

  try {
    const result = await callChatApi(messages, schemaDescription);
    
    // Add client-side ID and timestamp
    const recipe = {
      ...result,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      comments: [],
      isFavorite: false
    } as Recipe;
    
    return recipe;
  } catch (error) {
    console.error("Recipe Generation Error:", error);
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
  `;

  const schemaDescription = `{
    "recipes": [
      {
        "title": "string",
        "description": "string",
        "ingredientsDetected": ["string"],
        "steps": ["string"],
        "cookingTime": "string",
        "difficulty": "string",
        "chefComment": "string"
      }
    ]
  }`;

  const messages = [
    {
      role: "user",
      content: [
        { type: "text", text: prompt }
      ]
    }
  ];

  try {
    const result = await callChatApi(messages, schemaDescription);
    return (result.recipes || []).map((r: any) => ({
      ...r,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      comments: [],
      isFavorite: false
    }));
  } catch (error) {
    console.error("Recipe Search Error:", error);
    throw error;
  }
};
