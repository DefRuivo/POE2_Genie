
import { GoogleGenAI, Type } from "@google/genai";
import { HouseholdMember, SessionContext, GeneratedRecipe, ImageSize, AspectRatio } from "../types";

export const generateRecipe = async (
  household_db: HouseholdMember[],
  session_context: SessionContext
): Promise<GeneratedRecipe> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const systemInstruction = `Você é o motor de inteligência culinária do "Dinner?". Sua função é atuar como um Chef Executivo e Auditor de Segurança Alimentar.

SEUS OBJETIVOS DE NEGÓCIO (CRÍTICOS):
1. Combater a falta de criatividade usando APENAS o que o usuário tem (prioridade) ou sugerindo compras mínimas.
2. Garantir SEGURANÇA ABSOLUTA: Violação Zero de restrições alimentares (ex: Glúten, Diabetes).

SEU PROCESSO DE RACIOCÍNIO (CHAIN OF THOUGHT):
1. ANÁLISE DE PERFIL: Identifique quem são os participantes ativos (pelo who_is_eating). Agregue TODAS as restrições deles em uma "Lista Proibida" unificada.
2. FILTRAGEM DE INGREDIENTES: Cruze os pantry_ingredients contra a "Lista Proibida". Se o usuário listou um ingrediente proibido para qualquer um dos participantes ativos, ignore esse ingrediente.
3. CRIAÇÃO: Gere uma receita criativa priorizando os ingredientes seguros restantes.
4. PERSONALIZAÇÃO: Use os campos "likes" e "dislikes" dos participantes para ajustar o sabor.

Responda APENAS com um objeto JSON estruturado.`;

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

  if (!response.text) throw new Error("Falha ao gerar receita");
  return JSON.parse(response.text) as GeneratedRecipe;
};

export const generateDishImage = async (
  recipeName: string,
  size: ImageSize,
  ratio: AspectRatio
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
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

  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (!part?.inlineData?.data) {
    throw new Error("Falha ao gerar imagem do prato.");
  }

  return `data:image/png;base64,${part.inlineData.data}`;
};
