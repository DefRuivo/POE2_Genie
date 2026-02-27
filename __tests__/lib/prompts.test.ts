import {
  BUILD_GENERATION_SYSTEM_INSTRUCTION,
  RECIPE_GENERATION_SYSTEM_INSTRUCTION,
} from '@/lib/prompts';

describe('lib/prompts', () => {
  it('builds prompt with quick setup instruction and provided notes', () => {
    const text = BUILD_GENERATION_SYSTEM_INSTRUCTION(
      { requested_archetype: 'mapper', setup_time_preference: 'quick' },
      'Use cheap uniques only.',
      'Notes block',
    );

    expect(text).toContain('Follow the requested build archetype exactly: mapper');
    expect(text).toContain('Quick setup (under 30 minutes).');
    expect(text).toContain('Use cheap uniques only.');
    expect(text).toContain('Notes block');
    expect(text).toContain('Never expose internal enum keys or snake_case tokens');
  });

  it('builds prompt with longer setup branch and keeps legacy alias', () => {
    const text = BUILD_GENERATION_SYSTEM_INSTRUCTION(
      { requested_archetype: 'bossing', setup_time_preference: 'plenty' },
      'High-budget only.',
      '',
    );

    expect(text).toContain('Longer setup is acceptable.');
    expect(text).toContain('build_cost_tier');
    expect(RECIPE_GENERATION_SYSTEM_INSTRUCTION).toBe(BUILD_GENERATION_SYSTEM_INSTRUCTION);
  });
});

