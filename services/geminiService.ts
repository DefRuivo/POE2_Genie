
import { GoogleGenAI, Type } from "@google/genai";
import { HouseholdMember, SessionContext, GeneratedRecipe, ImageSize, AspectRatio } from "../types";

/**
 * Generates a safe and creative recipe based on household profiles and available ingredients.
 * The system instruction is tailored to the target language to ensure localized output.
 */
export const generateRecipe = async (
  household_db: HouseholdMember[],
  session_context: SessionContext,
  language: 'en' | 'pt' = 'en'
): Promise<GeneratedRecipe> => {
  // Initialize AI client using the provided environment variable.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = language === 'pt' 
    ? `Você é o motor de inteligência culinária do "Dinner?". Sua função é atuar como um Chef Executivo e Auditor de Segurança Alimentar.
SEUS OBJETIVOS:
1. Combater a falta de criatividade usando APENAS o que o usuário tem ou sugerindo compras mínimas.
2. Garantir SEGURANÇA ABSOLUTA: Violação Zero de restrições alimentares.
PROCESSO:
- Analise restrições dos participantes em who_is_eating.
- Filtre pantry_ingredients proibidos.
- Gere receita criativa e segura em PORTUGUÊS.
Responda APENAS com JSON.`
    : `You are the culinary intelligence engine for "Dinner?". Your role is to act as an Executive Chef and Food Safety Auditor.
BUSINESS OBJECTIVES:
1. Combat lack of creativity using ONLY what the user has (priority) or suggesting minimal purchases.
2. Ensure ABSOLUTE SAFETY: Zero violation of dietary restrictions (e.g., Gluten, Diabetes).
REASONING PROCESS:
- Identify active participants (via who_is_eating). Aggregate ALL their restrictions into a unified "Forbidden List".
- Filter pantry_ingredients against the list. If an ingredient is unsafe, ignore it.
- Create a creative recipe prioritizing safe remaining ingredients.
- Localize the entire output into ENGLISH.
Respond ONLY with a valid JSON object.`;

  const prompt = JSON.stringify({ household_db, session_context });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis_log: { type: Type.STRING },
          recipe_title: { type: Type.STRING },
          match_reasoning: { type: Type.STRING },
          ingredients_from_pantry: { type: Type.ARRAY, items: { type: Type.STRING } },
          shopping_list: { type: Type.ARRAY, items: { type: Type.STRING } },
          step_by_step: { type: Type.ARRAY, items: { type: Type.STRING } },
          safety_badge: { type: Type.BOOLEAN },
        },
        required: ["analysis_log", "recipe_title", "match_reasoning", "ingredients_from_pantry", "shopping_list", "step_by_step", "safety_badge"]
      }
    }
  });

  if (!response.text) throw new Error("Failed to generate recipe");
  return JSON.parse(response.text) as GeneratedRecipe;
};

/**
 * Generates a professional food photograph based on the recipe name.
 */
export const generateDishImage = async (
  recipeName: string,
  size: ImageSize,
  ratio: AspectRatio
): Promise<string> => {
  // Create a fresh instance to ensure we use the latest injected API Key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `A professional, high-quality food photography shot of ${recipeName}. 
The dish is plated beautifully in a modern kitchen setting. 
Vibrant colors, appetizing look, studio lighting. 
No text in image.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: ratio as any,
        imageSize: size as any
      }
    }
  });

  // Extract the image part from the response candidates.
  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (!part?.inlineData?.data) {
    throw new Error("Failed to generate dish image.");
  }

  return `data:image/png;base64,${part.inlineData.data}`;
};
