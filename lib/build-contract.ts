import {
  BuildArchetype,
  BuildCostTier,
  BuildEntry,
  BuildSessionContext,
  MealType,
  SetupTimePreference,
} from '@/types';
import { sanitizeBuildNarrativeFields } from '@/lib/output-text-sanitizer';

export type BuildResponseShape = 'canonical' | 'legacy';

const LEGACY_TO_CANONICAL_ARCHETYPE: Record<string, BuildArchetype> = {
  main: 'league_starter',
  main_course: 'league_starter',
  maincourse: 'league_starter',
  appetizer: 'mapper',
  starter: 'mapper',
  dessert: 'bossing',
  snack: 'hybrid',
  league_starter: 'league_starter',
  mapper: 'mapper',
  bossing: 'bossing',
  hybrid: 'hybrid',
};

const CANONICAL_TO_LEGACY_ARCHETYPE: Record<BuildArchetype, MealType> = {
  league_starter: 'main',
  mapper: 'appetizer',
  bossing: 'dessert',
  hybrid: 'snack',
};

const LEGACY_TO_CANONICAL_COST_TIER: Record<string, BuildCostTier> = {
  cheap: 'cheap',
  medium: 'medium',
  expensive: 'expensive',
  mirror_of_kalandra: 'mirror_of_kalandra',
  'mirror of kalandra': 'mirror_of_kalandra',
  mirror: 'mirror_of_kalandra',
  barato: 'cheap',
  medio: 'medium',
  'médio': 'medium',
  caro: 'expensive',
  easy: 'cheap',
  intermediate: 'medium',
  advanced: 'expensive',
  ascendant: 'mirror_of_kalandra',
  chef: 'mirror_of_kalandra',
};

const CANONICAL_TO_LEGACY_DIFFICULTY: Record<BuildCostTier, 'easy' | 'intermediate' | 'advanced' | 'chef'> = {
  cheap: 'easy',
  medium: 'intermediate',
  expensive: 'advanced',
  mirror_of_kalandra: 'chef',
};

type BuildLike = {
  analysis_log: string;
  build_title: string;
  build_reasoning: string;
  gear_gems: BuildEntry[];
  build_items: BuildEntry[];
  build_steps: string[];
  compliance_badge: boolean;
  build_archetype: BuildArchetype;
  build_cost_tier: BuildCostTier;
  setup_time: string;
  setup_time_minutes?: number | null;
  build_image?: string;
  language?: string;
  build_complexity?: BuildCostTier;
  id?: string;
  isFavorite?: boolean;
  createdAt?: number | string | Date;
  image_base64?: string;
  originalBuildId?: string | null;
  translations?: Array<{
    id: string;
    language: string;
    build_title: string;
    recipe_title?: string;
  }>;
};

function normalizeEntry(raw: any): BuildEntry {
  if (!raw) {
    return { name: '', quantity: '', unit: '' };
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          name: String(parsed.name || raw),
          quantity: String(parsed.quantity || ''),
          unit: String(parsed.unit || ''),
        };
      }
    } catch {
      return { name: raw, quantity: '', unit: '' };
    }
  }

  return {
    name: String(raw.name || ''),
    quantity: String(raw.quantity || ''),
    unit: String(raw.unit || ''),
  };
}

function normalizeEntries(raw: any): BuildEntry[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map(normalizeEntry).filter((item) => item.name.trim() !== '');
}

function normalizeSteps(raw: any): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((step) => {
      if (typeof step === 'string') return step.trim();
      if (step && typeof step.text === 'string') return step.text.trim();
      return '';
    })
    .filter(Boolean);
}

function normalizeTranslations(raw: any): BuildLike['translations'] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      id: String(item.id || ''),
      language: String(item.language || 'en'),
      build_title: String(item.build_title || item.recipe_title || ''),
      recipe_title: item.recipe_title ? String(item.recipe_title) : undefined,
    }))
    .filter((item) => item.id);
}

export function normalizeBuildArchetype(value: unknown): BuildArchetype {
  const normalized = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');

  return LEGACY_TO_CANONICAL_ARCHETYPE[normalized] || 'league_starter';
}

export function toLegacyArchetype(value: BuildArchetype): MealType {
  return CANONICAL_TO_LEGACY_ARCHETYPE[value] || 'main';
}

export function normalizeBuildCostTier(value: unknown): BuildCostTier {
  const normalized = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');

  return LEGACY_TO_CANONICAL_COST_TIER[normalized] || 'medium';
}

export function toLegacyDifficulty(value: BuildCostTier): 'easy' | 'intermediate' | 'advanced' | 'chef' {
  return CANONICAL_TO_LEGACY_DIFFICULTY[value] || 'intermediate';
}

/**
 * @deprecated Use normalizeBuildCostTier.
 */
export const normalizeBuildComplexity = normalizeBuildCostTier;

/**
 * @deprecated Use toLegacyDifficulty.
 */
export const toLegacyComplexity = toLegacyDifficulty;

export function normalizeSetupTimePreference(value: unknown): SetupTimePreference {
  const normalized = String(value || '').toLowerCase().trim();
  return normalized === 'plenty' ? 'plenty' : 'quick';
}

export function normalizeBuildSessionContext(raw: any): BuildSessionContext {
  const normalizedCostTier = normalizeBuildCostTier(
    raw?.cost_tier_preference
    || raw?.build_complexity
    || raw?.difficulty_preference
    || raw?.difficulty,
  );

  return {
    party_member_ids: Array.isArray(raw?.party_member_ids)
      ? raw.party_member_ids
      : Array.isArray(raw?.who_is_eating)
        ? raw.who_is_eating
        : [],
    stash_gear_gems: Array.isArray(raw?.stash_gear_gems)
      ? raw.stash_gear_gems
      : Array.isArray(raw?.pantry_ingredients)
        ? raw.pantry_ingredients
        : [],
    requested_archetype: normalizeBuildArchetype(raw?.requested_archetype || raw?.requested_type),
    cost_tier_preference: normalizedCostTier,
    setup_time_preference: normalizeSetupTimePreference(raw?.setup_time_preference || raw?.prep_time_preference),
    build_notes: raw?.build_notes || raw?.observation || '',
    language: raw?.language,
    build_complexity: normalizedCostTier,
  };
}

export function toLegacySessionContext(context: BuildSessionContext) {
  const normalizedCostTier = normalizeBuildCostTier(
    context?.cost_tier_preference || context?.build_complexity,
  );

  return {
    who_is_eating: context.party_member_ids,
    pantry_ingredients: context.stash_gear_gems,
    requested_type: toLegacyArchetype(context.requested_archetype),
    difficulty_preference: toLegacyDifficulty(normalizedCostTier),
    prep_time_preference: context.setup_time_preference,
    observation: context.build_notes || '',
    language: context.language,
  };
}

export function normalizeBuildPayload(raw: any): BuildLike {
  const setupTimeMinutesRaw = raw?.setup_time_minutes ?? raw?.prep_time_minutes;
  const setupTimeMinutes =
    setupTimeMinutesRaw === undefined || setupTimeMinutesRaw === null || setupTimeMinutesRaw === ''
      ? null
      : Number(setupTimeMinutesRaw);

  const normalized: BuildLike = {
    analysis_log: String(raw?.analysis_log || 'Manual Entry'),
    build_title: String(raw?.build_title || raw?.recipe_title || ''),
    build_reasoning: String(raw?.build_reasoning || raw?.match_reasoning || ''),
    gear_gems: normalizeEntries(raw?.gear_gems ?? raw?.ingredients_from_pantry),
    build_items: normalizeEntries(raw?.build_items ?? raw?.shopping_list),
    build_steps: normalizeSteps(raw?.build_steps ?? raw?.step_by_step),
    compliance_badge: Boolean(raw?.compliance_badge ?? raw?.safety_badge ?? true),
    build_archetype: normalizeBuildArchetype(raw?.build_archetype ?? raw?.meal_type),
    build_cost_tier: normalizeBuildCostTier(raw?.build_cost_tier ?? raw?.build_complexity ?? raw?.difficulty),
    setup_time: String(raw?.setup_time || raw?.prep_time || ''),
    setup_time_minutes: Number.isFinite(setupTimeMinutes) ? setupTimeMinutes : null,
    build_image: raw?.build_image || raw?.dishImage || undefined,
    language: raw?.language,
    id: raw?.id,
    isFavorite: typeof raw?.isFavorite === 'boolean' ? raw.isFavorite : false,
    createdAt: raw?.createdAt,
    image_base64: raw?.image_base64,
    originalBuildId: raw?.originalBuildId ?? raw?.originalRecipeId ?? null,
    translations: normalizeTranslations(raw?.translations),
  };

  const sanitized = sanitizeBuildNarrativeFields(normalized, normalized.language);
  sanitized.build_complexity = sanitized.build_cost_tier;

  return sanitized;
}

export function serializeBuildPayload(
  raw: any,
  shape: BuildResponseShape,
  responseLanguage?: string,
): Record<string, any> {
  const build = normalizeBuildPayload(raw);
  const sanitizedBuild = sanitizeBuildNarrativeFields(
    build,
    responseLanguage || build.language,
  );

  const canonicalPayload = {
    ...sanitizedBuild,
    translations: (build.translations || []).map((item) => ({
      id: item.id,
      language: item.language,
      build_title: item.build_title,
      recipe_title: item.recipe_title || item.build_title,
    })),
  };

  if (shape === 'canonical') {
    return {
      ...canonicalPayload,
      recipe_title: sanitizedBuild.build_title,
      match_reasoning: sanitizedBuild.build_reasoning,
      ingredients_from_pantry: sanitizedBuild.gear_gems,
      shopping_list: sanitizedBuild.build_items,
      step_by_step: sanitizedBuild.build_steps,
      safety_badge: sanitizedBuild.compliance_badge,
      meal_type: toLegacyArchetype(sanitizedBuild.build_archetype),
      difficulty: toLegacyDifficulty(sanitizedBuild.build_cost_tier),
      prep_time: sanitizedBuild.setup_time,
      prep_time_minutes: sanitizedBuild.setup_time_minutes,
      dishImage: sanitizedBuild.build_image,
      originalRecipeId: sanitizedBuild.originalBuildId,
    };
  }

  return {
    ...canonicalPayload,
    recipe_title: sanitizedBuild.build_title,
    match_reasoning: sanitizedBuild.build_reasoning,
    ingredients_from_pantry: sanitizedBuild.gear_gems,
    shopping_list: sanitizedBuild.build_items,
    step_by_step: sanitizedBuild.build_steps,
    safety_badge: sanitizedBuild.compliance_badge,
    meal_type: toLegacyArchetype(sanitizedBuild.build_archetype),
    difficulty: toLegacyDifficulty(sanitizedBuild.build_cost_tier),
    prep_time: sanitizedBuild.setup_time,
    prep_time_minutes: sanitizedBuild.setup_time_minutes,
    dishImage: sanitizedBuild.build_image,
    originalRecipeId: sanitizedBuild.originalBuildId,
    translations: (build.translations || []).map((item) => ({
      id: item.id,
      language: item.language,
      recipe_title: item.recipe_title || item.build_title,
      build_title: item.build_title,
    })),
  };
}
