import OpenAI from "openai";
import { ChefMode, Recipe, Language, DetectedIngredient } from "../types";

// --- 配置部分 ---

// 初始化 OpenAI 客户端 (用于对接 NewAPI)
// 这里的 baseURL 必须填写 NewAPI 的地址
const client = new OpenAI({
  baseURL: "https://api.chataiapi.com/v1", 
  apiKey: import.meta.env.VITE_API_KEY, // 请确保在 .env 文件中设置了新的 API Key
  dangerouslyAllowBrowser: true // 如果这是纯前端应用，需要开启此项；如果是后端应用请去掉
});

// 注意：目前 Gemini 最新版通常是 1.5-flash，2.5 尚未公开发布，这里帮你改为 1.5
const MODEL_NAME = "gemini-2.5-flash";

// --- 辅助函数 ---

// 确保 Base64 包含完整的前缀 (OpenAI 需要 data:image/... 格式)
function formatDataUrl(base64: string): string {
  // 如果已经包含前缀，直接返回
  if (base64.startsWith("data:")) return base64;
  
  // 尝试检测类型 (简单判断)
  let mimeType = "image/jpeg";
  if (base64.startsWith("/9j/")) mimeType = "image/jpeg";
  else if (base64.startsWith("iVBORw0KGgo")) mimeType = "image/png";
  else if (base64.startsWith("R0lGODdh")) mimeType = "image/gif";
  else if (base64.startsWith("UklGR")) mimeType = "image/webp";

  return `data:${mimeType};base64,${base64}`;
}

// 辅助：尝试解析 JSON，如果包含 Markdown 代码块则去除
function parseJSONResponse(content: string | null): any {
  if (!content) return {};
  try {
    // 移除可能存在的 ```json ... ``` 包裹
    const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleanContent);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    return {};
  }
}

// --- 核心功能 ---

export const identifyIngredients = async (
  imageBase64: string, 
  language: Language
): Promise<DetectedIngredient[]> => {
  const langInstruction = language === 'zh' ? "in Simplified Chinese (zh-CN)" : "in English";
  const imageUrl = formatDataUrl(imageBase64);

  const prompt = `
    Identify the main edible ingredients in this image.
    Return a STRICT JSON object (do not output markdown).
    
    Format:
    {
      "ingredients": [
        {
          "name": "Common name of the ingredient ${langInstruction}",
          "box_2d": [ymin, xmin, ymax, xmax] (Note: Use 0-1 float values)
        }
      ]
    }
    
    Guidelines:
    - ACCURACY IS CRITICAL.
    - Group similar items.
    - Only identify food ingredients.
  `;

  try {
    const response = await client.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ],
      response_format: { type: "json_object" } // 强制 JSON 模式
    });

    const result = parseJSONResponse(response.choices[0].message.content);
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
  const imageUrl = formatDataUrl(imageBase64);

  const persona = isMichelin
    ? `You are a world-renowned 3-star Michelin Chef. Use flowery, expensive-sounding culinary terms.`
    : `You are a chaotic 'Dark Cuisine' Chef (The Hell Kitchen Alchemist). Be dramatic, funny, and unconventional.`;

  const prompt = `
    The user wants to cook a dish using MAINLY these ingredients found in their fridge: [${ingredientsList}].
    Analyze the provided image for context (quantity, quality) but focus on the selected ingredients.
    
    Create a recipe in STRICT JSON format.
    Structure:
    {
      "title": "creative name",
      "description": "short engaging description",
      "ingredientsDetected": ["item1", "item2"],
      "steps": ["step 1", "step 2"],
      "cookingTime": "e.g. 30 mins",
      "difficulty": "Easy/Medium/Hard",
      "chefComment": "chef's specific comment",
      "tags": ["tag1", "tag2"]
    }

    ${langInstruction}
  `;

  try {
    const response = await client.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: persona },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const result = parseJSONResponse(response.choices[0].message.content);
    
    return {
      ...result,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      comments: [],
      isFavorite: false
    } as Recipe;
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
    
    Return a STRICT JSON object with a "recipes" array.
    Each recipe must follow this structure:
    {
       "title": "...",
       "description": "...",
       "ingredientsDetected": [...],
       "steps": [...],
       "cookingTime": "...",
       "difficulty": "...",
       "chefComment": "Why this is popular...",
       "tags": [...]
    }

    ${langInstruction}
  `;

  try {
    const response = await client.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: "You are a helpful recipe assistant." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const result = parseJSONResponse(response.choices[0].message.content);
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