import { assessBuildDomain, assessTextDomain } from '@/lib/domain-guardrails';

describe('domain guardrails', () => {
  it('flags clearly culinary build content as invalid', () => {
    const result = assessBuildDomain({
      build_title: 'Macarrão ao molho de tomate',
      build_reasoning: 'Receita de prato principal com frango',
      analysis_log: 'Assistente de receitas culinárias',
      gear_gems: [{ name: 'Tomate' }],
      build_items: [{ name: 'Sal' }],
      build_steps: ['Cozinhe e sirva'],
    });

    expect(result.isInvalid).toBe(true);
    expect(result.culinaryHits).toBeGreaterThan(0);
    expect(result.matchedTerms.length).toBeGreaterThan(0);
  });

  it('accepts valid PoE build content', () => {
    const result = assessBuildDomain({
      build_title: 'Lightning Arrow League Starter',
      build_reasoning: 'Fast mapper focused on atlas progression and resist cap.',
      analysis_log: 'PoE build planning with support gems and bow scaling.',
      gear_gems: [{ name: 'Lightning Arrow' }, { name: 'Mirage Archer Support' }],
      build_items: [{ name: 'Orb of Fusing' }, { name: 'Chaos Orb' }],
      build_steps: ['Get a 4-link bow', 'Run white maps', 'Upgrade to 6-link'],
    });

    expect(result.isInvalid).toBe(false);
    expect(result.poeHits).toBeGreaterThan(0);
  });

  it('rejects mixed content when culinary item terms appear', () => {
    const result = assessBuildDomain({
      build_title: 'Bossing Inquisitor',
      build_reasoning: 'Build for pinnacle bosses with high armor and resistance.',
      analysis_log: 'Path of Exile setup with support gems.',
      gear_gems: [{ name: 'Divine Orb' }],
      build_items: [{ name: 'Tomate' }],
      build_steps: ['Cap resistances first'],
    });

    expect(result.isInvalid).toBe(true);
    expect(result.highConfidenceCulinaryHits).toBeGreaterThan(0);
    expect(result.poeHits).toBeGreaterThan(0);
  });

  it('flags culinary units as invalid in build entries', () => {
    const result = assessBuildDomain({
      build_title: 'Arc Mapper',
      build_reasoning: 'Fast clear build for atlas maps.',
      analysis_log: 'PoE build planning.',
      gear_gems: [{ name: 'Arc', quantity: '1', unit: 'socket' }],
      build_items: [{ name: 'Olive Oil', quantity: '1', unit: 'tbsp' }],
      build_steps: ['Get 4-link setup'],
    });

    expect(result.isInvalid).toBe(true);
    expect(result.matchedTerms).toEqual(expect.arrayContaining(['olive oil', 'tbsp']));
  });

  it('assessTextDomain classifies culinary text with high confidence terms', () => {
    const result = assessTextDomain('Frango, arroz, tomate e alho para receita');

    expect(result.isCulinaryLikely).toBe(true);
    expect(result.highConfidenceHits).toBeGreaterThan(0);
    expect(result.matchedCulinaryTerms.length).toBeGreaterThan(0);
  });

  it('assessTextDomain marks likely culinary when multiple culinary terms have no PoE terms', () => {
    const result = assessTextDomain('pasta tomato olive oil');
    expect(result.culinaryHits).toBeGreaterThanOrEqual(2);
    expect(result.poeHits).toBe(0);
    expect(result.isCulinaryLikely).toBe(true);
  });

  it('assessTextDomain handles mixed text as non-culinary when PoE signal is strong', () => {
    const result = assessTextDomain('Path of Exile mapper build with atlas and chaos orb');
    expect(result.poeHits).toBeGreaterThan(0);
    expect(result.isCulinaryLikely).toBe(false);
  });

  it('assessBuildDomain invalidates by culinary critical text when no PoE terms exist', () => {
    const result = assessBuildDomain({
      build_title: 'Meal planner for family dinner',
      build_reasoning: 'Recipe and ingredient organization only',
      analysis_log: '',
      gear_gems: [],
      build_items: [],
      build_steps: [],
    });

    expect(result.isInvalid).toBe(true);
    expect(result.culinaryHits).toBeGreaterThan(0);
    expect(result.poeHits).toBe(0);
  });

  it('assessBuildDomain invalidates by culinary quantity threshold with weak PoE signal', () => {
    const result = assessBuildDomain({
      build_title: 'Mapper with sauce and tomato',
      build_reasoning: 'Use recipe style notes and kitchen prep',
      analysis_log: 'single poe mention atlas',
      gear_gems: [{ name: 'pasta', quantity: '', unit: '' }],
      build_items: [{ name: 'salt', quantity: '', unit: '' }],
      build_steps: ['cook quickly'],
    });

    expect(result.culinaryHits).toBeGreaterThanOrEqual(3);
    expect(result.isInvalid).toBe(true);
  });

  it('assessBuildDomain keeps valid PoE build when only PoE vocabulary exists', () => {
    const result = assessBuildDomain({
      build_title: 'Bossing Ascendant',
      build_reasoning: 'Scale dps with support gem links and resistances.',
      analysis_log: 'atlas progression and hideout upgrades',
      build_archetype: 'bossing',
      build_cost_tier: 'mirror_of_kalandra',
      setup_time: '30 min',
      gear_gems: [{ name: 'Orb of Fusing', quantity: '10', unit: 'x' }],
      build_items: [{ name: 'Waystone', quantity: '2', unit: 'x' }],
      build_steps: ['Get ascendancy points', 'Cap resistances'],
    });

    expect(result.isInvalid).toBe(false);
    expect(result.poeHits).toBeGreaterThan(0);
    expect(result.culinaryHits).toBe(0);
  });
});
