
import { GoogleGenAI, Type } from "@google/genai";
import { HouseholdMember, SessionContext, GeneratedRecipe } from "../types";

/**
 * Generates a safe and creative recipe based on household profiles, pantry, and meal type.
 */
export const generateRecipe = async (
  household_db: HouseholdMember[],
  session_context: SessionContext
): Promise<GeneratedRecipe> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const isChefMode = session_context.difficulty_preference === 'chef';
  const obs = session_context.observation ? `\n\nUSER OBSERVATIONS (CRITICAL): ${session_context.observation}` : '';
  const chefInstructionEn = isChefMode ? "CHEF MODE ACTIVATED: User wants to cook from scratch (doughs, sauces, stocks). Complex and technical recipe." : `Requested difficulty: ${session_context.difficulty_preference}.`;

  const systemInstruction = `You are the Executive Chef for "Dinner?".
OBJECTIVES:
1. Follow the requested meal type: ${session_context.requested_type}.
2. ${chefInstructionEn}
3. Prep time preference: ${session_context.prep_time_preference === 'quick' ? 'Quick (under 30min)' : 'Can take time'}.
4. If it is impossible to create a quality recipe of the requested type with the available ingredients, use analysis_log to explain exactly why.
5. Ensure 100% SAFETY against food restrictions.
${obs}
OUTPUT:
Localize the output to ENGLISH and respond ONLY with JSON.`;

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
          meal_type: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          prep_time: { type: Type.STRING }
        },
        required: ["analysis_log", "recipe_title", "match_reasoning", "ingredients_from_pantry", "shopping_list", "step_by_step", "safety_badge", "meal_type", "difficulty", "prep_time"]
      }
    }
  });

  if (!response.text) throw new Error("AI generation failed");
  return JSON.parse(response.text) as GeneratedRecipe;
};


