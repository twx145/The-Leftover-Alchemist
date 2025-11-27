import OpenAI from "openai";
import { ChefMode, Recipe, Language, DetectedIngredient } from "../types";

// ------------------------------------------------------------------
// 配置 OpenAI 客户端 (用于连接 ChatAIAPI)
// ------------------------------------------------------------------
// 建议: 不要把 Key 硬编码在这里，依然使用 process.env
const client = new OpenAI({
  apiKey: process.env.API_KEY, // 这里的 Key 应该是 sk- 开头的新 Key
  baseURL: "https://www.chataiapi.com/v1", // 中转商地址
  dangerouslyAllowBrowser: true // 如果你在前端直接运行构建，需要开启此项；如果是Next.js API路由则不需要
});

// 注意：请确认中转商支持的模型名称。
// 通常是 "gemini-1.5-flash" 或 "gemini-pro"。
// 如果中转商确实支持 "gemini-2.5-flash" 则保留，否则请改为 "gemini-1.5-flash"
const MODEL_NAME = "gemini-1.5-flash"; 

// ------------------------------------------------------------------
// 辅助函数
// ------------------------------------------------------------------

// OpenAI SDK 需要完整的 data url (例如: data:image/jpeg;base64,...)
// 如果传入的已经是完整格式，直接返回；如果是纯 base64，尝试补全
function ensureDataUrl(base64Str: string): string {
  if (base64Str.startsWith('data:')) {
    return base64Str;
  }
  // 默认假设为 jpeg，或者你可以复用之前的逻辑去猜测
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
                detail: "auto" // 这里的 detail 可以是 low, high, auto
              }
            }
          ]
        }
      ],
      // 强制 JSON 模式，大多数中转商对 Gemini 模型支持此参数
      response_format: { type: "json_object" } 
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(content || "{}");
    
    // 兼容可能返回的不同 JSON 结构，确保拿到数组
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