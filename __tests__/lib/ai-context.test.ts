jest.mock('fs/promises', () => ({
  readFile: jest.fn()
}));

describe('ai-context helper', () => {
  let readFileMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.AI_CONTEXT_FILE_PATH;
    readFileMock = require('fs/promises').readFile as jest.Mock;
  });

  it('returns content when context file exists', async () => {
    readFileMock.mockResolvedValue('  local context  ');

    const { getLocalAiContext } = require('@/lib/ai-context');
    const result = await getLocalAiContext();

    expect(result).toBe('local context');
    expect(readFileMock).toHaveBeenCalledWith(
      expect.stringMatching(/\.ai[\\/]ai-context\.local\.md$/),
      'utf8'
    );
  });

  it('returns empty string when file does not exist', async () => {
    const missingFileError = Object.assign(new Error('Missing file'), { code: 'ENOENT' });
    readFileMock.mockRejectedValue(missingFileError);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { getLocalAiContext } = require('@/lib/ai-context');
    const result = await getLocalAiContext();

    expect(result).toBe('');
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('returns empty string and warns when read fails for non-ENOENT error', async () => {
    const readError = Object.assign(new Error('Permission denied'), { code: 'EACCES' });
    readFileMock.mockRejectedValue(readError);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { getLocalAiContext } = require('@/lib/ai-context');
    const result = await getLocalAiContext();

    expect(result).toBe('');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[AI Context] Failed to read local context file'),
      readError
    );
    warnSpy.mockRestore();
  });

  it('uses AI_CONTEXT_FILE_PATH when provided', async () => {
    process.env.AI_CONTEXT_FILE_PATH = 'config/custom-context.md';
    readFileMock.mockResolvedValue('custom context');

    const { getLocalAiContext } = require('@/lib/ai-context');
    await getLocalAiContext();

    expect(readFileMock).toHaveBeenCalledWith(
      expect.stringMatching(/config[\\/]custom-context\.md$/),
      'utf8'
    );
  });
});
