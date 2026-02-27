import { NextRequest } from 'next/server';
import { getBuilds } from '@/app/api/recipes/route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    recipe: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn().mockResolvedValue({ kitchenId: 'kitchen-1', userId: 'user-1' }),
}));

describe('GET /api/recipes text sanitization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.recipe.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'build-1',
        originalRecipeId: null,
        language: 'pt-BR',
        recipe_title: 'Arc Build',
        analysis_log: "Plano para 'league_starter' com progressão segura.",
        match_reasoning: "Build 'league starter' eficiente com caminho para o tier 'mirror_of_kalandra'.",
        step_by_step: ["Escalar para 'mirror_of_kalandra'"],
        safety_badge: true,
        meal_type: 'main',
        difficulty: 'mirror_of_kalandra',
        prep_time: '45m',
        prep_time_minutes: 45,
        dishImage: '',
        createdAt: new Date('2024-01-01'),
        ingredients: [],
        shoppingItems: [],
        favoritedBy: [],
        translations: [],
      },
    ]);
  });

  it('returns sanitized narrative fields in legacy shape', async () => {
    const req = new NextRequest('http://localhost/api/recipes?lang=pt-BR');
    const res = await getBuilds(req, 'legacy');
    const body = await res.json();

    expect(body[0].match_reasoning).toContain('League Starter');
    expect(body[0].match_reasoning).toContain('Mirror of Kalandra');
    expect(body[0].analysis_log).toContain('League Starter');
    expect(body[0].step_by_step[0]).toContain('Mirror of Kalandra');
    expect(body[0].match_reasoning).not.toContain('mirror_of_kalandra');
  });

  it('returns sanitized narrative fields in canonical shape without changing enums', async () => {
    const req = new NextRequest('http://localhost/api/recipes?lang=pt-BR');
    const res = await getBuilds(req, 'canonical');
    const body = await res.json();

    expect(body[0].build_reasoning).toContain('League Starter');
    expect(body[0].build_reasoning).toContain('Mirror of Kalandra');
    expect(body[0].build_steps[0]).toContain('Mirror of Kalandra');
    expect(body[0].build_cost_tier).toBe('mirror_of_kalandra');
    expect(body[0].build_archetype).toBe('league_starter');
  });
});
