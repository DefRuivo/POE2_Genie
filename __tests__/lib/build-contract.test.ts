import {
  normalizeBuildArchetype,
  normalizeBuildCostTier,
  normalizeBuildPayload,
  normalizeSetupTimePreference,
  normalizeBuildSessionContext,
  serializeBuildPayload,
  toLegacyArchetype,
  toLegacySessionContext,
  toLegacyDifficulty,
} from '@/lib/build-contract';

describe('build-contract cost tier normalization', () => {
  it('maps legacy and localized difficulty values to canonical cost tiers', () => {
    expect(normalizeBuildCostTier('easy')).toBe('cheap');
    expect(normalizeBuildCostTier('intermediate')).toBe('medium');
    expect(normalizeBuildCostTier('advanced')).toBe('expensive');
    expect(normalizeBuildCostTier('chef')).toBe('mirror_of_kalandra');
    expect(normalizeBuildCostTier('barato')).toBe('cheap');
    expect(normalizeBuildCostTier('médio')).toBe('medium');
    expect(normalizeBuildCostTier('caro')).toBe('expensive');
  });

  it('normalizes context using canonical and legacy preference fields', () => {
    const canonical = normalizeBuildSessionContext({
      party_member_ids: ['m1'],
      stash_gear_gems: ['Orb of Alchemy'],
      requested_archetype: 'mapper',
      cost_tier_preference: 'expensive',
      setup_time_preference: 'quick',
    });

    expect(canonical.cost_tier_preference).toBe('expensive');

    const legacy = normalizeBuildSessionContext({
      who_is_eating: ['m2'],
      pantry_ingredients: ['Orb of Fusing'],
      requested_type: 'main',
      difficulty_preference: 'ascendant',
      prep_time_preference: 'plenty',
    });

    expect(legacy.cost_tier_preference).toBe('mirror_of_kalandra');
  });

  it('serializes canonical and legacy payload shapes with mapped cost fields', () => {
    const normalized = normalizeBuildPayload({
      recipe_title: 'Lightning Arrow Starter',
      match_reasoning: "Build 'league starter' eficiente com caminho para o tier 'mirror_of_kalandra'.",
      analysis_log: 'Plano técnico para league_starter sem desperdício.',
      ingredients_from_pantry: [{ name: 'Lightning Arrow', quantity: '1', unit: 'socket' }],
      shopping_list: [{ name: 'Divine Orb', quantity: '2', unit: 'x' }],
      step_by_step: ["Escalar até 'mirror of kalandra'", 'Cap resistances'],
      meal_type: 'appetizer',
      difficulty: 'advanced',
      prep_time: '45m',
      prep_time_minutes: 45,
      safety_badge: true,
    });

    expect(normalized.build_cost_tier).toBe('expensive');
    expect(toLegacyDifficulty(normalized.build_cost_tier)).toBe('advanced');
    expect(normalized.build_reasoning).toContain('League Starter');
    expect(normalized.build_reasoning).toContain('Mirror of Kalandra');
    expect(normalized.build_steps[0]).toContain('Mirror of Kalandra');
    expect(normalized.analysis_log).toContain('League Starter');

    const canonical = serializeBuildPayload(normalized, 'canonical', 'pt-BR');
    const legacy = serializeBuildPayload(normalized, 'legacy', 'pt-BR');

    expect(canonical.build_cost_tier).toBe('expensive');
    expect(legacy.difficulty).toBe('advanced');
    expect(canonical.build_reasoning).toContain('League Starter');
    expect(canonical.match_reasoning).toContain('Mirror of Kalandra');
    expect(legacy.step_by_step[0]).toContain('Mirror of Kalandra');
    expect(canonical.build_cost_tier).toBe('expensive');
    expect(canonical.build_archetype).toBe('mapper');
  });

  it('normalizes empty and malformed entry/step payloads safely', () => {
    const normalized = normalizeBuildPayload({
      build_title: 'Test',
      build_reasoning: 'Reason',
      gear_gems: [null, '{"name":"Orb of Alchemy","quantity":"2","unit":"x"}', '{bad-json', { name: '  ' }],
      build_items: 'not-array',
      build_steps: [{ text: ' Step one ' }, 123, ' step two '],
      build_archetype: 'unknown',
      build_cost_tier: 'unknown',
      setup_time: '10m',
    });

    expect(normalized.gear_gems).toEqual([
      { name: 'Orb of Alchemy', quantity: '2', unit: 'x' },
      { name: '{bad-json', quantity: '', unit: '' },
    ]);
    expect(normalized.build_items).toEqual([]);
    expect(normalized.build_steps).toEqual(['Step one', 'step two']);
    expect(normalized.build_archetype).toBe('league_starter');
    expect(normalized.build_cost_tier).toBe('medium');
  });

  it('maps archetype/setup-time helpers and legacy session serializer', () => {
    expect(normalizeBuildArchetype(' main course ')).toBe('league_starter');
    expect(normalizeBuildArchetype('dessert')).toBe('bossing');
    expect(toLegacyArchetype('hybrid')).toBe('snack');
    expect(toLegacyArchetype('league_starter')).toBe('main');

    expect(normalizeSetupTimePreference('plenty')).toBe('plenty');
    expect(normalizeSetupTimePreference('invalid')).toBe('quick');

    const legacyContext = toLegacySessionContext({
      party_member_ids: ['m1'],
      stash_gear_gems: ['Wand'],
      requested_archetype: 'mapper',
      cost_tier_preference: 'mirror_of_kalandra',
      setup_time_preference: 'quick',
      build_notes: 'notes',
      language: 'pt-BR',
      build_complexity: 'mirror_of_kalandra',
    });

    expect(legacyContext).toEqual(
      expect.objectContaining({
        who_is_eating: ['m1'],
        pantry_ingredients: ['Wand'],
        requested_type: 'appetizer',
        difficulty_preference: 'chef',
        prep_time_preference: 'quick',
        observation: 'notes',
        language: 'pt-BR',
      }),
    );
  });
});
