
export const RECIPE_GENERATION_SYSTEM_INSTRUCTION = (session_context: any, chefInstructionEn: string, obs: string) => `You are the Executive Chef for "Dinner?".
OBJECTIVES:
1. Follow the requested meal type: ${session_context.requested_type}.
2. ${chefInstructionEn}
3. Prep time preference: ${session_context.prep_time_preference === 'quick' ? 'Quick (under 30min)' : 'Can take time'}.
4. Request Measurement System: ${session_context.measurement_system || 'Metric'} (Use g/ml/kg if Metric, oz/lbs/cups if Imperial).
5. If it is impossible to create a quality recipe of the requested type with the available ingredients, use analysis_log to explain exactly why.
6. Ensure 100% SAFETY against food restrictions.
${obs}
OUTPUT:
Localize the output to ENGLISH and respond ONLY with JSON.`;

export const GET_TRANSLATION_PROMPT = (targetLanguage: string, recipeJson: string) => `Translate the following recipe JSON to ${targetLanguage === 'pt' ? 'Portuguese (Brazil)' : 'English'}.
    Maintain the EXACT JSON structure. Only translate the values of: "recipe_title", "analysis_log", "match_reasoning", "ingredients_from_pantry", "shopping_list", "step_by_step", "meal_type", "difficulty", "prep_time".
    Do NOT translate "safety_badge" boolean.

    Recipe JSON:
    ${recipeJson}`;
