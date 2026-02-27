import {
  sanitizeBuildNarrativeFields,
  sanitizeBuildNarrativeText,
} from '@/lib/output-text-sanitizer';
import { en } from '@/lib/locales/en';

describe('output-text-sanitizer', () => {
  it('sanitizes quoted snake_case tokens in PT-BR narrative text', () => {
    const input = "build 'league starter' eficiente com caminho claro para o tier 'mirror_of_kalandra'";
    const result = sanitizeBuildNarrativeText(input, 'pt-BR');

    expect(result).toContain('League Starter');
    expect(result).toContain('Mirror of Kalandra');
    expect(result).not.toContain('mirror_of_kalandra');
    expect(result).not.toContain("'league starter'");
  });

  it('sanitizes narrative fields without touching structured non-narrative fields', () => {
    const payload = {
      analysis_log: 'Plano com "league_starter" e custo chef.',
      build_reasoning: "Fluxo para 'mirror of kalandra'.",
      build_steps: ['Escalar para mirror_of_kalandra', 'Fechar setup de league starter'],
      gear_gems: [{ name: 'Mirror of Kalandra', quantity: '1', unit: 'x' }],
    };

    const sanitized = sanitizeBuildNarrativeFields(payload, 'pt-BR');

    expect(sanitized.analysis_log).toContain('League Starter');
    expect(sanitized.analysis_log).toContain('Mirror of Kalandra');
    expect(sanitized.build_reasoning).toContain('Mirror of Kalandra');
    expect(sanitized.build_steps[0]).toContain('Mirror of Kalandra');
    expect(sanitized.gear_gems[0].name).toBe('Mirror of Kalandra');
  });

  it('keeps text unchanged when no known technical token is present', () => {
    const text = 'Bow build with strong survivability and smooth progression.';
    expect(sanitizeBuildNarrativeText(text, 'en')).toBe(text);
  });

  it('supports english labels and quoted token replacements for costs and archetypes', () => {
    const text = `Use "league_starter" path, then move to 'medium' and finally "expensive".`;
    const result = sanitizeBuildNarrativeText(text, 'en');

    expect(result).toContain('League Starter');
    expect(result).toContain('Medium');
    expect(result).toContain('Expensive');
    expect(result).not.toContain('league_starter');
    expect(result).not.toContain('"expensive"');
  });

  it('handles undefined/null text values safely and keeps non-array build_steps as-is', () => {
    expect(sanitizeBuildNarrativeText(undefined, 'en')).toBe('');
    expect(sanitizeBuildNarrativeText(null, 'pt-BR')).toBe('');

    const payload = {
      analysis_log: undefined,
      build_reasoning: null,
      build_steps: 'single step',
    } as any;
    const sanitized = sanitizeBuildNarrativeFields(payload, 'en');

    expect(sanitized.analysis_log).toBe('');
    expect(sanitized.build_reasoning).toBe('');
    expect(sanitized.build_steps).toBe('single step');
  });

  it('falls back to hardcoded english labels when locale labels are missing', () => {
    const backup = {
      leagueStarter: en.recipeForm.leagueStarter,
      mapper: en.recipeForm.mapper,
      bossing: en.recipeForm.bossing,
      hybrid: en.recipeForm.hybrid,
      cheap: en.recipeForm.cheap,
      medium: en.recipeForm.medium,
      expensive: en.recipeForm.expensive,
      mirror: en.recipeForm.mirrorOfKalandra,
    };

    en.recipeForm.leagueStarter = '';
    en.recipeForm.mapper = '';
    en.recipeForm.bossing = '';
    en.recipeForm.hybrid = '';
    en.recipeForm.cheap = '';
    en.recipeForm.medium = '';
    en.recipeForm.expensive = '';
    en.recipeForm.mirrorOfKalandra = '';

    const result = sanitizeBuildNarrativeText(
      `'league_starter' mapper bossing hybrid cheap medium expensive mirror_of_kalandra`,
      'en',
    );

    expect(result).toContain('League Starter');
    expect(result).toContain('Mapper');
    expect(result).toContain('Bossing');
    expect(result).toContain('Hybrid');
    expect(result).toContain('Cheap');
    expect(result).toContain('Medium');
    expect(result).toContain('Expensive');
    expect(result).toContain('Mirror of Kalandra');

    en.recipeForm.leagueStarter = backup.leagueStarter;
    en.recipeForm.mapper = backup.mapper;
    en.recipeForm.bossing = backup.bossing;
    en.recipeForm.hybrid = backup.hybrid;
    en.recipeForm.cheap = backup.cheap;
    en.recipeForm.medium = backup.medium;
    en.recipeForm.expensive = backup.expensive;
    en.recipeForm.mirrorOfKalandra = backup.mirror;
  });
});
