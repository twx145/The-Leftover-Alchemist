import OpenAI from "openai";
import { ChefMode, Recipe, Language, DetectedIngredient } from "../types";

// ------------------------------------------------------------------
// 配置 OpenAI 客户端
// ------------------------------------------------------------------

// Vite 环境必须使用 import.meta.env.VITE_ 开头的变量
const apiKey = "sk-CU2KO5ZBLJKkRhlV4o6rDGQzRQembG0U89gWfnHsIpYc3LK5";

if (!apiKey) {
  console.error("⚠️ 警告: 未检测到 VITE_API_KEY，API 调用将会失败。请检查 .env 文件。");
}

const client = new OpenAI({
  apiKey: apiKey,
  baseURL: "https://www.chataiapi.com/v1", // 中转商地址
  dangerouslyAllowBrowser: true // 允许在浏览器端运行
});

// 模型名称
const MODEL_NAME = "gemini-2.5-flash"; 

// ------------------------------------------------------------------
// 辅助函数
// ------------------------------------------------------------------

function ensureDataUrl(base64Str: string): string {
  if (base64Str.startsWith('data:')) {
    return base64Str;
  }
  return `data:image/jpeg;base64,${base64Str}`;
}

// ------------------------------------------------------------------
// 核心功能
// ------------------------------------------------------------------

export const identifyIngredients = async (
  imageBase64: string, 
  language: Language
): Promise<DetectedIngredient[]> => {
  const langInstruction = language === 'zh' ? "in Simplified Chinese (zh-CN)" : "in English";
  
  const prompt = `
    Identify the main edible ingredients in this image.
    Return a list of ingredients with their 2D bounding boxes.
    
    GUIDELINES:
    1. 'name': Common name of the ingredient ${langInstruction}.
    2. 'box_2d': [ymin, xmin, ymax, xmax] (0-1).
    3. ACCURACY IS CRITICAL.
    4. Only identify food ingredients.
    5. RETURN JSON ONLY.
  `;

  try {
    const response = await client.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: ensureDataUrl(imageBase64),
                detail: "auto"
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" } 
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(content || "{}");
    
    // 兼容可能返回的字段差异
    return result.ingredients || result.items || [];
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

    Return a JSON object with this structure:
    {
      "title": "string",
      "description": "string",
      "ingredientsDetected": ["string"],
      "steps": ["string"],
      "cookingTime": "string",
      "difficulty": "string",
      "chefComment": "string",
      "tags": ["string"]
    }
  `;

  try {
    const response = await client.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: ensureDataUrl(imageBase64)
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content;
    const result = JSON.parse(content || "{}");
    
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

    Return a JSON object with this structure:
    {
      "recipes": [
        {
           "title": "string",
           "description": "string",
           "ingredientsDetected": ["string"],
           "steps": ["string"],
           "cookingTime": "string",
           "difficulty": "string",
           "chefComment": "string",
           "tags": ["string"]
        }
      ]
    }
  `;

  try {
    const response = await client.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(content || "{}");
    
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