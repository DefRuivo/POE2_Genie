import { GoogleGenAI, Type } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { getLocalAiContext } from "@/lib/ai-context";
import {
  BuildSessionContext,
  GeneratedBuild,
  GeneratedRecipe,
  KitchenMember,
  SessionContext,
} from "../types";
import {
  normalizeBuildPayload,
  normalizeBuildSessionContext,
  serializeBuildPayload,
} from "@/lib/build-contract";
import { BUILD_GENERATION_SYSTEM_INSTRUCTION } from "@/lib/prompts";
import { assessBuildDomain, type DomainAssessment } from "@/lib/domain-guardrails";

const getPrimaryModel = () => process.env.GEMINI_MODEL_PRIMARY || 'gemini-3-pro-preview';
const getFallbackModel = () => process.env.GEMINI_MODEL_FALLBACK || 'gemini-2.5-flash';

type GeminiErrorPayload = {
  error?: {
    code?: number;
    status?: string;
    message?: string;
    details?: Array<{
      "@type"?: string;
      retryDelay?: string;
    }>;
  };
};

const parseGeminiErrorPayload = (error: any): GeminiErrorPayload | null => {
  if (!error) {
    return null;
  }

  if (error.error && typeof error.error === 'object') {
    return { error: error.error };
  }

  if (typeof error.message === 'string') {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && typeof parsed === 'object') {
        return parsed as GeminiErrorPayload;
      }
    } catch {
      return null;
    }
  }

  return null;
};

const parseRetryDelaySeconds = (error: any, payload: GeminiErrorPayload | null): number | null => {
  const details = payload?.error?.details;
  if (Array.isArray(details)) {
    const retryInfo = details.find(item => item?.["@type"]?.includes("RetryInfo"));
    const retryDelay = retryInfo?.retryDelay;

    if (typeof retryDelay === 'string') {
      const match = retryDelay.match(/([0-9]+(?:\.[0-9]+)?)s/i);
      if (match) {
        return Math.max(1, Math.ceil(Number(match[1])));
      }
    }
  }

  const retryFromMessage = payload?.error?.message || (typeof error?.message === 'string' ? error.message : '');
  const retryMatch = retryFromMessage.match(/retry in ([0-9]+(?:\.[0-9]+)?)s/i);
  if (retryMatch) {
    return Math.max(1, Math.ceil(Number(retryMatch[1])));
  }

  return null;
};

const isGeminiQuotaExceededError = (error: any): boolean => {
  const payload = parseGeminiErrorPayload(error);
  const statusFromPayload = payload?.error?.status;
  const codeFromPayload = payload?.error?.code;
  const numericStatus = Number(error?.status ?? error?.code ?? codeFromPayload);

  return numericStatus === 429 || statusFromPayload === 'RESOURCE_EXHAUSTED';
};

const buildGeminiQuotaExceededError = (error: any): Error => {
  const payload = parseGeminiErrorPayload(error);
  const retryAfterSeconds = parseRetryDelaySeconds(error, payload);

  const structuredError = new Error("Gemini quota exceeded");
  (structuredError as any).status = 429;
  (structuredError as any).code = 'gemini.quota_exceeded';
  (structuredError as any).retryAfterSeconds = retryAfterSeconds;
  (structuredError as any).cause = error;

  return structuredError;
};

const buildLocalContextInstruction = (localAiContext: string): string => {
  if (!localAiContext) {
    return "";
  }

  return `\n\nLOCAL APPLICATION CONTEXT (FOLLOW STRICTLY):\n${localAiContext}`;
};

const DOMAIN_CORRECTION_INSTRUCTION = `
CRITICAL DOMAIN CORRECTION:
- Output strictly Path of Exile build domain content.
- Do not output culinary semantics (food, recipes, dishes, kitchen tasks, ingredients for cooking).
- If context appears culinary, reinterpret as PoE build planning only.
`;

const buildDomainMismatchError = (assessment: DomainAssessment): Error => {
  const structuredError = new Error("Generated content is outside Path of Exile build domain");
  (structuredError as any).status = 422;
  (structuredError as any).code = 'gemini.domain_mismatch';
  (structuredError as any).details = assessment.matchedTerms;
  return structuredError;
};

/**
 * Crafts a safe and practical build based on party profiles, stash, and build archetype.
 */
export const craftBuildWithAI = async (
  partyMembersDb: KitchenMember[],
  rawContext: BuildSessionContext | SessionContext
): Promise<GeneratedBuild> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const primaryModel = getPrimaryModel();
  const fallbackModel = getFallbackModel();
  const session_context = normalizeBuildSessionContext(rawContext);

  const costTier = session_context.cost_tier_preference || session_context.build_complexity || 'medium';
  const costTierInstructionEn = costTier === 'cheap'
    ? 'Requested cost tier: cheap (up to 1 Divine Orb). Prioritize low-cost progression and budget alternatives.'
    : costTier === 'medium'
      ? 'Requested cost tier: medium (1 to 10 Divine Orbs). Balance efficiency, survivability, and upgrades.'
      : costTier === 'expensive'
        ? 'Requested cost tier: expensive (10 to 100 Divine Orbs). Include stronger upgrades and scaling paths.'
        : 'Requested cost tier: Mirror of Kalandra (1+ Mirrors of Kalandra). Provide premium endgame optimization and luxury upgrades.';
  const notesInstruction = session_context.build_notes
    ? `\n\nPLAYER NOTES (CRITICAL): ${session_context.build_notes}`
    : '';

  // Language instruction
  const langInstruction = session_context.language ? `\nIMPORTANT: OUTPUT MUST BE IN "${session_context.language}" LANGUAGE.` : '';
  const localAiContext = await getLocalAiContext();

  const systemInstruction = BUILD_GENERATION_SYSTEM_INSTRUCTION(session_context, costTierInstructionEn, notesInstruction)
    + langInstruction
    + buildLocalContextInstruction(localAiContext);

  const prompt = JSON.stringify({ party_members: partyMembersDb, build_context: session_context });

  const generateWithModel = async (model: string, correctionInstruction = '') => ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: `${systemInstruction}${correctionInstruction}`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis_log: { type: Type.STRING },
          build_title: { type: Type.STRING },
          build_reasoning: { type: Type.STRING },
          gear_gems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { name: { type: Type.STRING }, quantity: { type: Type.STRING }, unit: { type: Type.STRING } },
            },
          },
          build_items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { name: { type: Type.STRING }, quantity: { type: Type.STRING }, unit: { type: Type.STRING } },
            },
          },
          build_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
          compliance_badge: { type: Type.BOOLEAN },
          build_archetype: { type: Type.STRING },
          build_cost_tier: { type: Type.STRING },
          setup_time: { type: Type.STRING },
          setup_time_minutes: { type: Type.NUMBER },
          language: { type: Type.STRING }
        },
        required: [
          "analysis_log",
          "build_title",
          "build_reasoning",
          "gear_gems",
          "build_items",
          "build_steps",
          "compliance_badge",
          "build_archetype",
          "build_cost_tier",
          "setup_time",
          "setup_time_minutes",
        ]
      }
    }
  });

  const generateWithFallback = async (correctionInstruction = '') => {
    try {
      return await generateWithModel(primaryModel, correctionInstruction);
    } catch (primaryError: any) {
      if (isGeminiQuotaExceededError(primaryError) && fallbackModel && fallbackModel !== primaryModel) {
        console.warn(`[Gemini] Quota exceeded on ${primaryModel}. Retrying with fallback model ${fallbackModel}.`);

        try {
          return await generateWithModel(fallbackModel, correctionInstruction);
        } catch (fallbackError: any) {
          if (isGeminiQuotaExceededError(fallbackError)) {
            throw buildGeminiQuotaExceededError(fallbackError);
          }
          throw fallbackError;
        }
      }

      if (isGeminiQuotaExceededError(primaryError)) {
        throw buildGeminiQuotaExceededError(primaryError);
      }

      throw primaryError;
    }
  };

  let response = await generateWithFallback();
  if (!response.text) throw new Error("AI generation failed");

  let parsedBuild = normalizeBuildPayload(JSON.parse(response.text)) as unknown as GeneratedBuild;
  let domainAssessment = assessBuildDomain(parsedBuild);

  if (domainAssessment.isInvalid) {
    console.warn('[Gemini] Domain mismatch detected. Retrying generation with strict PoE correction.', {
      culinaryHits: domainAssessment.culinaryHits,
      poeHits: domainAssessment.poeHits,
      matchedTerms: domainAssessment.matchedTerms,
    });

    response = await generateWithFallback(DOMAIN_CORRECTION_INSTRUCTION);
    if (!response.text) throw new Error("AI generation failed");

    parsedBuild = normalizeBuildPayload(JSON.parse(response.text)) as unknown as GeneratedBuild;
    domainAssessment = assessBuildDomain(parsedBuild);

    if (domainAssessment.isInvalid) {
      throw buildDomainMismatchError(domainAssessment);
    }
  }

  // Log usage
  try {
    const inputTokens = response.usageMetadata?.promptTokenCount || 0;
    const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;

    // Attempt to attribute usage to a user/hideout (legacy DB field: kitchenId).
    let userId: string | undefined;
    let kitchenId: string | undefined;

    if (partyMembersDb.length > 0) {
      // Use the first member's active hideout context.
      kitchenId = partyMembersDb[0].kitchenId;
      userId = partyMembersDb[0].userId || undefined;
    }

    await prisma.geminiUsage.create({
      data: {
        prompt,
        response: response.text,
        inputTokens,
        outputTokens,
        userId,
        kitchenId
      }
    });
  } catch (err) {
    console.error("Failed to log Gemini usage:", err);
  }

  return parsedBuild;
};

/**
 * Translates an existing build record to a target language.
 */
export const translateBuild = async (
  build: GeneratedBuild | GeneratedRecipe,
  targetLanguage: string,
  context?: { userId?: string; kitchenId?: string }
): Promise<GeneratedBuild> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const getLanguageName = (code: string) => {
    const map: Record<string, string> = {
      'pt-BR': 'Brazilian Portuguese',
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian'
    };
    return map[code] || code;
  };

  const fullLanguage = getLanguageName(targetLanguage);
  const localAiContext = await getLocalAiContext();
  const normalizedBuild = normalizeBuildPayload(build);

  const systemInstruction = `
    You are a professional Path of Exile build translator.
    Translate the given JSON build into "${fullLanguage}".
    Preserve the JSON structure exactly.
    Translate all user-facing strings (title, reasoning, instructions).
    IMPORTANT: You MUST translate the 'name' and 'unit' fields inside 'gear_gems' AND 'build_items' arrays.
    Do NOT remove any items from 'gear_gems' or 'build_items'. Keep the counts exactly the same.
    Do not translate Keys.
    For 'analysis_log', provide a brief translation note.${buildLocalContextInstruction(localAiContext)}
  `;

  const prompt = JSON.stringify(normalizedBuild);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis_log: { type: Type.STRING },
          build_title: { type: Type.STRING },
          build_reasoning: { type: Type.STRING },
          gear_gems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { name: { type: Type.STRING }, quantity: { type: Type.STRING }, unit: { type: Type.STRING } },
            },
          },
          build_items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { name: { type: Type.STRING }, quantity: { type: Type.STRING }, unit: { type: Type.STRING } },
            },
          },
          build_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
          compliance_badge: { type: Type.BOOLEAN },
          build_archetype: { type: Type.STRING },
          build_cost_tier: { type: Type.STRING },
          setup_time: { type: Type.STRING },
          setup_time_minutes: { type: Type.NUMBER }
        },
        required: [
          "analysis_log",
          "build_title",
          "build_reasoning",
          "gear_gems",
          "build_items",
          "build_steps",
          "compliance_badge",
          "build_archetype",
          "build_cost_tier",
          "setup_time",
          "setup_time_minutes",
        ]
      }
    }
  });

  if (!response.text) throw new Error("Build translation failed");

  // Log usage
  try {
    const inputTokens = response.usageMetadata?.promptTokenCount || 0;
    const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;

    await prisma.geminiUsage.create({
      data: {
        prompt,
        response: response.text,
        inputTokens,
        outputTokens,
        userId: context?.userId,
        kitchenId: context?.kitchenId
      }
    });
  } catch (err) {
    console.error("Failed to log Gemini usage:", err);
  }

  return normalizeBuildPayload(JSON.parse(response.text)) as unknown as GeneratedBuild;
};

/**
 * @deprecated Use craftBuildWithAI.
 */
export const generateRecipe = async (
  partyMembersDb: KitchenMember[],
  session_context: SessionContext
): Promise<GeneratedRecipe> => {
  const canonicalBuild = await craftBuildWithAI(partyMembersDb, session_context);
  return serializeBuildPayload(canonicalBuild, 'legacy') as unknown as GeneratedRecipe;
};

/**
 * @deprecated Use translateBuild.
 */
export const translateRecipe = async (
  buildLikeLegacyPayload: GeneratedRecipe,
  targetLanguage: string,
  context?: { userId?: string; kitchenId?: string }
): Promise<GeneratedRecipe> => {
  const translatedBuild = await translateBuild(buildLikeLegacyPayload, targetLanguage, context);
  return serializeBuildPayload(translatedBuild, 'legacy') as unknown as GeneratedRecipe;
};
