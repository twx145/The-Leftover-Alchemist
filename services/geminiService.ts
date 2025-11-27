import OpenAI from "openai";
import { ChefMode, Recipe, Language, DetectedIngredient } from "../types";

// --- 配置部分 ---

// 1. 获取 Key (为了排查问题，如果 import.meta.env 获取不到，可以暂时先硬编码测试，测通后再换回环境变量)
const API_KEY = import.meta.env.VITE_API_KEY; 
// const API_KEY = "sk-0yYPQHh1LRIuuoLrkguZzHZaaD1Q39FW0s4ODnn7S8B7WniV"; // 如果上面不行，取消这行注释测试

if (!API_KEY) {
  console.error("❌ 严重错误: 没有找到 VITE_API_KEY，请检查 .env 文件并重启项目");
} else {
  console.log(`✅ API Key 已加载: ${API_KEY.slice(0, 5)}...${API_KEY.slice(-4)}`);
}

// 初始化 OpenAI 客户端
const client = new OpenAI({
  baseURL: "https://api.chataiapi.com/v1", // 必须与 Python 代码一致
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true // 允许在浏览器端运行
});

// 使用 Python 测试通过的模型
const MODEL_NAME = "gemini-2.5-flash";

// --- 辅助函数 ---

/**
 * 格式化图片数据，确保符合 OpenAI 格式 (data:image/jpeg;base64,...)
 */
function formatDataUrl(input: string): string {
  if (!input) return "";
  
  // 如果已经是 data: 开头，直接返回
  if (input.startsWith("data:")) return input;

  // 简单的 MIME 类型推断，默认 jpeg
  let mimeType = "image/jpeg";
  if (input.startsWith("iVBORw0KGgo")) mimeType = "image/png";
  else if (input.startsWith("R0lGODdh")) mimeType = "image/gif";
  else if (input.startsWith("UklGR")) mimeType = "image/webp";

  return `data:${mimeType};base64,${input}`;
}

/**
 * 安全解析 JSON
 */
function parseJSONResponse(content: string | null): any {
  if (!content) return {};
  try {
    const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleanContent);
  } catch (e) {
    console.error("JSON Parse Error. Raw content:", content);
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

  // 模仿 Python 的 Prompt 结构
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

  console.log("🚀 发起 identifyIngredients 请求...");

  try {
    const response = await client.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: "user", // 保持 User 角色，不使用 System
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    console.log("✅ API 响应成功");
    const result = parseJSONResponse(response.choices[0].message.content);
    return result.ingredients || [];
  } catch (error: any) {
    console.error("❌ Identify Ingredients Error:", error);
    // 打印更详细的错误信息用于调试
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
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
    ? "IMPORTANT: Output all text content in Simplified Chinese (zh-CN)." 
    : "IMPORTANT: Output all text content in English.";

  const ingredientsList = selectedIngredients.join(', ');
  const imageUrl = formatDataUrl(imageBase64);

  // 将 Persona (人设) 合并到 Prompt 中，避免使用 System Role 导致某些中转 API 报错
  const persona = isMichelin
    ? `You are a world-renowned 3-star Michelin Chef. Use flowery, expensive-sounding culinary terms.`
    : `You are a chaotic 'Dark Cuisine' Chef (The Hell Kitchen Alchemist). Be dramatic, funny, and unconventional.`;

  const prompt = `
    ${persona}
    
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

  console.log("🚀 发起 generateRecipeFromImage 请求...");

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
    Structure per recipe:
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
        // 纯文本请求通常可以用 System role，但为了保险起见，这里也合并成 User
        { role: "user", content: `You are a helpful recipe assistant.\n\n${prompt}` }
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