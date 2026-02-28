import { generateRecipe, translateRecipe } from '../../services/geminiService';
import { GoogleGenAI } from '@google/genai';
import { prisma } from '../../lib/prisma';
import { getLocalAiContext } from '@/lib/ai-context';

jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => ({
      models: {
        generateContent: jest.fn()
      }
    })),
    Type: { OBJECT: 'OBJECT', STRING: 'STRING', ARRAY: 'ARRAY', BOOLEAN: 'BOOLEAN', NUMBER: 'NUMBER' }
  };
});

jest.mock('../../lib/prisma', () => ({
  prisma: {
    geminiUsage: {
      create: jest.fn()
    }
  }
}));

jest.mock('@/lib/ai-context', () => ({
  getLocalAiContext: jest.fn()
}));

const makeValidBuildPayload = (overrides: Record<string, any> = {}) => JSON.stringify({
  analysis_log: 'PoE build plan focused on mapping and progression.',
  build_title: 'Lightning Arrow League Starter',
  build_reasoning: 'Uses bow scaling, support gems, and safe progression.',
  gear_gems: [{ name: 'Lightning Arrow', quantity: '1', unit: 'socket' }],
  build_items: [{ name: 'Orb of Fusing', quantity: '20', unit: 'x' }],
  build_steps: ['Get a 4-link bow', 'Cap elemental resistances', 'Start mapping in white maps'],
  compliance_badge: true,
  build_archetype: 'league_starter',
  build_cost_tier: 'cheap',
  setup_time: '30 min',
  setup_time_minutes: 30,
  ...overrides,
});

const makeInvalidCulinaryPayload = () => JSON.stringify({
  analysis_log: 'Este sistema é um assistente de receitas culinárias.',
  build_title: 'Macarrão com frango',
  build_reasoning: 'Receita de prato principal rápido.',
  gear_gems: [{ name: 'Tomate', quantity: '2', unit: 'x' }],
  build_items: [{ name: 'Sal', quantity: '1', unit: 'x' }],
  build_steps: ['Cozinhe a massa', 'Misture os ingredientes'],
  compliance_badge: true,
  build_archetype: 'league_starter',
  build_cost_tier: 'cheap',
  setup_time: '20 minutos',
  setup_time_minutes: 20,
});

describe('geminiService', () => {
  const mockHousehold = [{ id: '1', name: 'Member', kitchenId: 'k1', userId: 'u1' }];
  const mockContext = {
    requested_type: 'main',
    cost_tier_preference: 'cheap',
    difficulty_preference: 'easy',
    prep_time_preference: 'quick',
    measurement_system: 'METRIC'
  } as any;

  const makeQuotaError = (retryDelay = '46s') => {
    const payload = {
      error: {
        code: 429,
        status: 'RESOURCE_EXHAUSTED',
        message: `Please retry in ${retryDelay}.`,
        details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay }]
      }
    };

    return Object.assign(new Error(JSON.stringify(payload)), { status: 429 });
  };

  const makeModelNotFoundError = (model = 'gemini-3-flash') => {
    const payload = {
      error: {
        code: 404,
        status: 'NOT_FOUND',
        message: `models/${model} is not found for API version v1beta, or is not supported for generateContent.`,
      }
    };

    return Object.assign(new Error(JSON.stringify(payload)), { status: 404 });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_MODEL_PRIMARY = 'gemini-3-pro-preview';
    process.env.GEMINI_MODEL_FALLBACK = 'gemini-2.5-flash';
    (getLocalAiContext as jest.Mock).mockResolvedValue('Keep stash-first suggestions only.');
  });

  afterEach(() => {
    delete process.env.GEMINI_MODEL_PRIMARY;
    delete process.env.GEMINI_MODEL_FALLBACK;
  });

  it('generateRecipe should return parsed recipe on primary model success and include local context', async () => {
    const mockResponseText = makeValidBuildPayload();

    const mockGenerateContent = jest.fn().mockResolvedValue({
      text: mockResponseText,
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20 }
    });

    (GoogleGenAI as unknown as jest.Mock).mockImplementation(() => ({
      models: { generateContent: mockGenerateContent }
    }));

    const result = await generateRecipe(mockHousehold as any, mockContext);

    expect(result.recipe_title).toBe('Lightning Arrow League Starter');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    expect(mockGenerateContent.mock.calls[0][0].model).toBe('gemini-3-pro-preview');
    expect(mockGenerateContent.mock.calls[0][0].config.systemInstruction).toEqual(
      expect.stringContaining('LOCAL APPLICATION CONTEXT (FOLLOW STRICTLY):')
    );
    expect(prisma.geminiUsage.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        kitchenId: 'k1',
        inputTokens: 10
      })
    }));
  });

  it('generateRecipe should keep cost-tier instruction human readable (no snake_case token)', async () => {
    const mockResponseText = makeValidBuildPayload({ build_cost_tier: 'mirror_of_kalandra' });
    const contextWithMirrorTier = {
      ...mockContext,
      cost_tier_preference: 'mirror_of_kalandra',
    };

    const mockGenerateContent = jest.fn().mockResolvedValue({
      text: mockResponseText,
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20 }
    });

    (GoogleGenAI as unknown as jest.Mock).mockImplementation(() => ({
      models: { generateContent: mockGenerateContent }
    }));

    await generateRecipe(mockHousehold as any, contextWithMirrorTier as any);

    const systemInstruction = mockGenerateContent.mock.calls[0][0].config.systemInstruction;
    expect(systemInstruction).toContain('Mirror of Kalandra');
    expect(systemInstruction).not.toContain('mirror_of_kalandra');
  });

  it('generateRecipe should fallback to secondary model when primary returns quota exceeded', async () => {
    const mockResponseText = makeValidBuildPayload({ build_title: 'Fallback Build' });

    const mockGenerateContent = jest
      .fn()
      .mockRejectedValueOnce(makeQuotaError('46s'))
      .mockResolvedValueOnce({ text: mockResponseText, usageMetadata: { promptTokenCount: 8, candidatesTokenCount: 12 } });

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    (GoogleGenAI as unknown as jest.Mock).mockImplementation(() => ({
      models: { generateContent: mockGenerateContent }
    }));

    const result = await generateRecipe(mockHousehold as any, mockContext);

    expect(result.recipe_title).toBe('Fallback Build');
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect(mockGenerateContent.mock.calls[0][0].model).toBe('gemini-3-pro-preview');
    expect(mockGenerateContent.mock.calls[1][0].model).toBe('gemini-2.5-flash');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Quota exceeded on gemini-3-pro-preview')
    );

    warnSpy.mockRestore();
  });

  it('generateRecipe should auto-heal when configured fallback model is invalid and succeed on canonical fallback', async () => {
    process.env.GEMINI_MODEL_FALLBACK = 'gemini-3-flash';
    const mockResponseText = makeValidBuildPayload({ build_title: 'Recovered via Canonical Fallback' });

    const mockGenerateContent = jest
      .fn()
      .mockRejectedValueOnce(makeQuotaError('5s'))
      .mockRejectedValueOnce(makeModelNotFoundError('gemini-3-flash'))
      .mockResolvedValueOnce({ text: mockResponseText, usageMetadata: { promptTokenCount: 9, candidatesTokenCount: 14 } });

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    (GoogleGenAI as unknown as jest.Mock).mockImplementation(() => ({
      models: { generateContent: mockGenerateContent }
    }));

    const result = await generateRecipe(mockHousehold as any, mockContext);

    expect(result.recipe_title).toBe('Recovered via Canonical Fallback');
    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    expect(mockGenerateContent.mock.calls[0][0].model).toBe('gemini-3-pro-preview');
    expect(mockGenerateContent.mock.calls[1][0].model).toBe('gemini-3-flash');
    expect(mockGenerateContent.mock.calls[2][0].model).toBe('gemini-2.5-flash');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Model gemini-3-flash unavailable for generateContent')
    );

    warnSpy.mockRestore();
  });

  it('generateRecipe should retry once when first response is culinary and then succeed', async () => {
    const mockGenerateContent = jest
      .fn()
      .mockResolvedValueOnce({ text: makeInvalidCulinaryPayload() })
      .mockResolvedValueOnce({ text: makeValidBuildPayload({ build_title: 'Recovered Build' }) });

    (GoogleGenAI as unknown as jest.Mock).mockImplementation(() => ({
      models: { generateContent: mockGenerateContent }
    }));

    const result = await generateRecipe(mockHousehold as any, mockContext);

    expect(result.recipe_title).toBe('Recovered Build');
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect(mockGenerateContent.mock.calls[1][0].config.systemInstruction).toEqual(
      expect.stringContaining('CRITICAL DOMAIN CORRECTION')
    );
  });

  it('generateRecipe should throw structured domain mismatch when retry still returns culinary output', async () => {
    const mockGenerateContent = jest
      .fn()
      .mockResolvedValueOnce({ text: makeInvalidCulinaryPayload() })
      .mockResolvedValueOnce({ text: makeInvalidCulinaryPayload() });

    (GoogleGenAI as unknown as jest.Mock).mockImplementation(() => ({
      models: { generateContent: mockGenerateContent }
    }));

    await expect(generateRecipe(mockHousehold as any, mockContext)).rejects.toMatchObject({
      status: 422,
      code: 'gemini.domain_mismatch',
      details: expect.any(Array),
    });

    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('generateRecipe should throw structured quota error when all attempted models hit 429', async () => {
    const mockGenerateContent = jest
      .fn()
      .mockRejectedValueOnce(makeQuotaError('46s'))
      .mockRejectedValueOnce(makeQuotaError('46s'))
      .mockRejectedValueOnce(makeQuotaError('46s'));

    (GoogleGenAI as unknown as jest.Mock).mockImplementation(() => ({
      models: { generateContent: mockGenerateContent }
    }));

    await expect(generateRecipe(mockHousehold as any, mockContext)).rejects.toMatchObject({
      message: 'Gemini quota exceeded',
      status: 429,
      code: 'gemini.quota_exceeded',
      retryAfterSeconds: 46
    });

    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
  });

  it('generateRecipe should parse quota payload from object error shape and extract retry delay from message', async () => {
    const quotaObj = {
      error: {
        code: 429,
        status: 'RESOURCE_EXHAUSTED',
        message: 'Please retry in 2.1s.',
      },
    };
    const mockGenerateContent = jest
      .fn()
      .mockRejectedValueOnce(quotaObj)
      .mockRejectedValueOnce(quotaObj)
      .mockRejectedValueOnce(quotaObj);

    (GoogleGenAI as unknown as jest.Mock).mockImplementation(() => ({
      models: { generateContent: mockGenerateContent }
    }));

    await expect(generateRecipe(mockHousehold as any, mockContext)).rejects.toMatchObject({
      message: 'Gemini quota exceeded',
      retryAfterSeconds: 3,
    });
  });

  it('generateRecipe should keep retryAfterSeconds null when quota error has no retry hint', async () => {
    const quotaObj = {
      error: {
        code: 429,
        status: 'RESOURCE_EXHAUSTED',
        message: 'Rate limit exceeded.',
      },
    };
    const mockGenerateContent = jest
      .fn()
      .mockRejectedValueOnce(quotaObj)
      .mockRejectedValueOnce(quotaObj)
      .mockRejectedValueOnce(quotaObj);

    (GoogleGenAI as unknown as jest.Mock).mockImplementation(() => ({
      models: { generateContent: mockGenerateContent }
    }));

    await expect(generateRecipe(mockHousehold as any, mockContext)).rejects.toMatchObject({
      message: 'Gemini quota exceeded',
      retryAfterSeconds: null,
    });
  });

  it('generateRecipe should surface fallback model non-quota errors', async () => {
    const mockGenerateContent = jest
      .fn()
      .mockRejectedValueOnce(makeQuotaError('1s'))
      .mockRejectedValueOnce(new Error('fallback failed'));

    (GoogleGenAI as unknown as jest.Mock).mockImplementation(() => ({
      models: { generateContent: mockGenerateContent }
    }));

    await expect(generateRecipe(mockHousehold as any, mockContext)).rejects.toThrow('fallback failed');
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('generateRecipe should throw quota when configured fallback is same as primary and canonical fallbacks also hit quota', async () => {
    process.env.GEMINI_MODEL_FALLBACK = 'gemini-3-pro-preview';
    const mockGenerateContent = jest
      .fn()
      .mockRejectedValueOnce(makeQuotaError('4s'))
      .mockRejectedValueOnce(makeQuotaError('4s'))
      .mockRejectedValueOnce(makeQuotaError('4s'));

    (GoogleGenAI as unknown as jest.Mock).mockImplementation(() => ({
      models: { generateContent: mockGenerateContent }
    }));

    await expect(generateRecipe(mockHousehold as any, mockContext)).rejects.toMatchObject({
      message: 'Gemini quota exceeded',
      retryAfterSeconds: 4,
    });
    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
  });

  it('generateRecipe should throw structured model_unavailable when chain is exhausted by unavailable models', async () => {
    process.env.GEMINI_MODEL_FALLBACK = 'gemini-3-flash';
    const mockGenerateContent = jest
      .fn()
      .mockRejectedValueOnce(makeQuotaError('4s'))
      .mockRejectedValueOnce(makeModelNotFoundError('gemini-3-flash'))
      .mockRejectedValueOnce(makeModelNotFoundError('gemini-2.5-flash'))
      .mockRejectedValueOnce(makeModelNotFoundError('gemini-2.5-flash-lite'));

    (GoogleGenAI as unknown as jest.Mock).mockImplementation(() => ({
      models: { generateContent: mockGenerateContent }
    }));

    await expect(generateRecipe(mockHousehold as any, mockContext)).rejects.toMatchObject({
      status: 503,
      code: 'gemini.model_unavailable',
      details: expect.any(Array),
    });

    expect(mockGenerateContent).toHaveBeenCalledTimes(4);
  });

  it('generateRecipe should handle empty local AI context without appending local-context block', async () => {
    (getLocalAiContext as jest.Mock).mockResolvedValueOnce('');
    const mockGenerateContent = jest.fn().mockResolvedValue({
      text: makeValidBuildPayload({ build_title: 'No Local Context Block' }),
    });
    (GoogleGenAI as unknown as jest.Mock).mockImplementation(() => ({
      models: { generateContent: mockGenerateContent }
    }));

    await generateRecipe(mockHousehold as any, mockContext);
    const systemInstruction = mockGenerateContent.mock.calls[0][0].config.systemInstruction as string;
    expect(systemInstruction).not.toContain('LOCAL APPLICATION CONTEXT (FOLLOW STRICTLY):');
  });

  it('generateRecipe should propagate non-quota objects (no message string) without fallback', async () => {
    const mockGenerateContent = jest.fn().mockRejectedValueOnce({ code: 500, foo: 'bar' });

    (GoogleGenAI as unknown as jest.Mock).mockImplementation(() => ({
      models: { generateContent: mockGenerateContent }
    }));

    await expect(generateRecipe(mockHousehold as any, mockContext)).rejects.toEqual({ code: 500, foo: 'bar' });
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('generateRecipe should propagate null rejections', async () => {
    const mockGenerateContent = jest.fn().mockRejectedValueOnce(null);

    (GoogleGenAI as unknown as jest.Mock).mockImplementation(() => ({
      models: { generateContent: mockGenerateContent }
    }));

    await expect(generateRecipe(mockHousehold as any, mockContext)).rejects.toBeNull();
  });

  it('generateRecipe should not fallback when error is not quota related', async () => {
    const mockGenerateContent = jest.fn().mockRejectedValue(new Error('Boom'));

    (GoogleGenAI as unknown as jest.Mock).mockImplementation(() => ({
      models: { generateContent: mockGenerateContent }
    }));

    await expect(generateRecipe(mockHousehold as any, mockContext)).rejects.toThrow('Boom');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('generateRecipe should throw error if AI response is empty', async () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({ text: null });
    (GoogleGenAI as unknown as jest.Mock).mockImplementation(() => ({
      models: { generateContent: mockGenerateContent }
    }));

    await expect(generateRecipe(mockHousehold as any, mockContext)).rejects.toThrow('AI generation failed');
  });

  it('generateRecipe should handle logging failure gracefully', async () => {
    const mockResponseText = makeValidBuildPayload({ build_title: 'Log Check Build' });
    const mockGenerateContent = jest.fn().mockResolvedValue({ text: mockResponseText });

    (GoogleGenAI as unknown as jest.Mock).mockImplementation(() => ({
      models: { generateContent: mockGenerateContent }
    }));

    (prisma.geminiUsage.create as jest.Mock).mockRejectedValue(new Error('DB Error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await generateRecipe(mockHousehold as any, mockContext);

    expect(consoleSpy).toHaveBeenCalledWith('Failed to log Gemini usage:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('translateRecipe should include local context and log usage with context', async () => {
    const mockRecipe = {
      recipe_title: 'Lightning Arrow League Starter',
      ingredients_from_pantry: [{ name: 'Lightning Arrow', quantity: '1', unit: 'socket' }],
      shopping_list: [{ name: 'Orb of Fusing', quantity: '20', unit: 'x' }],
      step_by_step: ['Get a 4-link bow'],
      analysis_log: 'PoE planning log',
      match_reasoning: 'PoE reasoning',
      safety_badge: true,
      meal_type: 'main',
      difficulty: 'easy',
      prep_time: '10m',
      prep_time_minutes: 10
    } as any;

    const mockResponseText = makeValidBuildPayload({ build_title: 'Traduzida' });
    const mockGenerateContent = jest.fn().mockResolvedValue({
      text: mockResponseText,
      usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 12 }
    });

    (GoogleGenAI as unknown as jest.Mock).mockImplementation(() => ({
      models: { generateContent: mockGenerateContent }
    }));

    const result = await translateRecipe(mockRecipe, 'pt-BR', { userId: 'u1', kitchenId: 'k1' });

    expect(result.recipe_title).toBe('Traduzida');
    expect(mockGenerateContent.mock.calls[0][0].model).toBe('gemini-2.5-flash');
    expect(mockGenerateContent.mock.calls[0][0].config.systemInstruction).toEqual(
      expect.stringContaining('LOCAL APPLICATION CONTEXT (FOLLOW STRICTLY):')
    );
    expect(prisma.geminiUsage.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: 'u1',
        kitchenId: 'k1',
        inputTokens: 5,
        outputTokens: 12
      })
    }));
  });
});
