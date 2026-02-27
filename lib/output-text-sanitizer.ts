import { en } from '@/lib/locales/en';

type SupportedLanguage = string | undefined;

type NarrativeBuildLike = {
  analysis_log?: unknown;
  build_reasoning?: unknown;
  build_steps?: unknown;
};

type NarrativeLabelKey =
  | 'leagueStarter'
  | 'mapper'
  | 'bossing'
  | 'hybrid'
  | 'cheap'
  | 'medium'
  | 'expensive'
  | 'mirrorOfKalandra';

const TOKEN_VARIANTS: Record<NarrativeLabelKey, string[]> = {
  leagueStarter: ['league_starter', 'league starter', 'main_course', 'maincourse'],
  mapper: ['mapper'],
  bossing: ['bossing'],
  hybrid: ['hybrid'],
  cheap: ['cheap'],
  medium: ['medium'],
  expensive: ['expensive'],
  mirrorOfKalandra: ['mirror_of_kalandra', 'mirror of kalandra', 'ascendant', 'chef'],
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function getNarrativeLabels(language?: SupportedLanguage): Record<NarrativeLabelKey, string> {
  const isPt = String(language || '').toLowerCase().startsWith('pt');

  if (isPt) {
    return {
      leagueStarter: 'League Starter',
      mapper: 'Mapper',
      bossing: 'Bossing',
      hybrid: 'Hybrid',
      cheap: 'Barato',
      medium: 'Médio',
      expensive: 'Caro',
      mirrorOfKalandra: 'Mirror of Kalandra',
    };
  }

  return {
    leagueStarter: en.recipeForm.leagueStarter || 'League Starter',
    mapper: en.recipeForm.mapper || 'Mapper',
    bossing: en.recipeForm.bossing || 'Bossing',
    hybrid: en.recipeForm.hybrid || 'Hybrid',
    cheap: en.recipeForm.cheap || 'Cheap',
    medium: en.recipeForm.medium || 'Medium',
    expensive: en.recipeForm.expensive || 'Expensive',
    mirrorOfKalandra: en.recipeForm.mirrorOfKalandra || 'Mirror of Kalandra',
  };
}

export function sanitizeBuildNarrativeText(value: unknown, language?: SupportedLanguage): string {
  const labels = getNarrativeLabels(language);
  let text = String(value ?? '');

  for (const [labelKey, variants] of Object.entries(TOKEN_VARIANTS) as Array<[NarrativeLabelKey, string[]]>) {
    const replacement = labels[labelKey];

    for (const variant of variants) {
      const escapedVariant = escapeRegExp(variant);
      const quotedPattern = new RegExp(`(["'])\\s*${escapedVariant}\\s*\\1`, 'giu');
      const plainPattern = new RegExp(`\\b${escapedVariant}\\b`, 'giu');

      text = text.replace(quotedPattern, replacement);
      text = text.replace(plainPattern, replacement);
    }
  }

  return text;
}

export function sanitizeBuildNarrativeFields<T extends NarrativeBuildLike>(buildLike: T, language?: SupportedLanguage): T {
  const sanitizedSteps = Array.isArray(buildLike.build_steps)
    ? buildLike.build_steps.map((step) => sanitizeBuildNarrativeText(step, language))
    : buildLike.build_steps;

  return {
    ...buildLike,
    analysis_log: sanitizeBuildNarrativeText(buildLike.analysis_log, language),
    build_reasoning: sanitizeBuildNarrativeText(buildLike.build_reasoning, language),
    build_steps: sanitizedSteps,
  };
}
