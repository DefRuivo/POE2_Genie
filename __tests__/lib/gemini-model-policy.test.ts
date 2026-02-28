describe('lib/gemini-model-policy', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('getConfiguredModels returns defaults when env vars are missing', async () => {
    const { getConfiguredModels } = await import('@/lib/gemini-model-policy');

    const models = getConfiguredModels({} as NodeJS.ProcessEnv);
    expect(models).toEqual({
      primaryModel: 'gemini-3-pro-preview',
      fallbackModel: 'gemini-2.5-flash',
    });
  });

  it('buildModelAttemptChain is deduplicated and keeps quality-first order', async () => {
    const { buildModelAttemptChain } = await import('@/lib/gemini-model-policy');

    const chain = buildModelAttemptChain({
      primaryModel: 'gemini-3-pro-preview',
      fallbackModel: 'gemini-2.5-flash',
    });

    expect(chain).toEqual([
      'gemini-3-pro-preview',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
    ]);
  });

  it('isModelNotFoundError detects 404 NOT_FOUND payloads', async () => {
    const { isModelNotFoundError } = await import('@/lib/gemini-model-policy');
    const error = Object.assign(
      new Error(JSON.stringify({ error: { code: 404, status: 'NOT_FOUND', message: 'model not found' } })),
      { status: 404 },
    );

    expect(isModelNotFoundError(error)).toBe(true);
  });

  it('validateConfiguredModelsWithList warns unavailable configured models when models.list exists', async () => {
    const { validateConfiguredModelsWithList } = await import('@/lib/gemini-model-policy');
    const aiMock = {
      models: {
        list: jest.fn().mockResolvedValue((async function* () {
          yield { name: 'models/gemini-3-pro-preview' };
          yield { name: 'models/gemini-2.5-flash' };
        })()),
      },
    } as any;

    const result = await validateConfiguredModelsWithList(aiMock, {
      primaryModel: 'gemini-3-pro-preview',
      fallbackModel: 'gemini-3-flash',
    });

    expect(result).toEqual({
      unavailableConfiguredModels: ['gemini-3-flash'],
    });
  });
});

