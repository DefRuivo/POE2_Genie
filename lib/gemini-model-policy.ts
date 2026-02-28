import type { GoogleGenAI } from "@google/genai";

export const DEFAULT_GEMINI_PRIMARY_MODEL = "gemini-3-pro-preview";
export const DEFAULT_GEMINI_FALLBACK_MODEL = "gemini-2.5-flash";

const CANONICAL_GEMINI_FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
] as const;

export type ConfiguredGeminiModels = {
  primaryModel: string;
  fallbackModel: string;
};

export type GeminiErrorPayload = {
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

const normalizeConfiguredModel = (value: unknown, fallbackValue: string): string => {
  if (typeof value !== "string") {
    return fallbackValue;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallbackValue;
};

export const getConfiguredModels = (env: NodeJS.ProcessEnv = process.env): ConfiguredGeminiModels => ({
  primaryModel: normalizeConfiguredModel(env.GEMINI_MODEL_PRIMARY, DEFAULT_GEMINI_PRIMARY_MODEL),
  fallbackModel: normalizeConfiguredModel(env.GEMINI_MODEL_FALLBACK, DEFAULT_GEMINI_FALLBACK_MODEL),
});

export const buildModelAttemptChain = (
  configuredModels: ConfiguredGeminiModels = getConfiguredModels(),
): string[] => {
  const seen = new Set<string>();
  const chain: string[] = [];

  const addModel = (model: string) => {
    if (!model || seen.has(model)) {
      return;
    }
    seen.add(model);
    chain.push(model);
  };

  addModel(configuredModels.primaryModel);
  addModel(configuredModels.fallbackModel);
  for (const fallbackModel of CANONICAL_GEMINI_FALLBACK_MODELS) {
    addModel(fallbackModel);
  }

  return chain;
};

export const parseGeminiErrorPayload = (error: any): GeminiErrorPayload | null => {
  if (!error) {
    return null;
  }

  if (error.error && typeof error.error === "object") {
    return { error: error.error };
  }

  if (typeof error.message === "string") {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && typeof parsed === "object") {
        return parsed as GeminiErrorPayload;
      }
    } catch {
      return null;
    }
  }

  return null;
};

export const isModelNotFoundError = (error: any): boolean => {
  const payload = parseGeminiErrorPayload(error);
  const statusFromPayload = payload?.error?.status;
  const codeFromPayload = payload?.error?.code;
  const numericStatus = Number(error?.status ?? error?.code ?? codeFromPayload);
  const message = payload?.error?.message || (typeof error?.message === "string" ? error.message : "");

  return (
    numericStatus === 404 ||
    statusFromPayload === "NOT_FOUND" ||
    /is not found for API version/i.test(message)
  );
};

let cachedModelNames: Set<string> | null = null;
let modelListCacheExpiresAt = 0;
const MODEL_LIST_CACHE_TTL_MS = 10 * 60 * 1000;

const normalizeModelName = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.includes("/")) {
    const parts = trimmed.split("/");
    return parts[parts.length - 1];
  }
  return trimmed;
};

const supportsModelsList = (ai: GoogleGenAI): boolean => (
  Boolean(ai?.models && typeof (ai.models as any).list === "function")
);

export const validateConfiguredModelsWithList = async (
  ai: GoogleGenAI,
  configuredModels: ConfiguredGeminiModels,
): Promise<{ unavailableConfiguredModels: string[] }> => {
  if (!supportsModelsList(ai)) {
    return { unavailableConfiguredModels: [] };
  }

  const now = Date.now();
  if (!cachedModelNames || now >= modelListCacheExpiresAt) {
    try {
      const names = new Set<string>();
      const pager = await (ai.models as any).list();
      for await (const model of pager) {
        if (typeof model?.name === "string") {
          names.add(normalizeModelName(model.name));
        }
      }
      cachedModelNames = names;
      modelListCacheExpiresAt = now + MODEL_LIST_CACHE_TTL_MS;
    } catch {
      console.warn("[Gemini] Failed to validate configured models via models.list()", {
        reason: "models_list_failed",
      });
      return { unavailableConfiguredModels: [] };
    }
  }

  const unavailableConfiguredModels: string[] = [];
  const configuredToCheck = [configuredModels.primaryModel, configuredModels.fallbackModel];

  for (const model of configuredToCheck) {
    if (!cachedModelNames?.has(model)) {
      unavailableConfiguredModels.push(model);
    }
  }

  return { unavailableConfiguredModels };
};
