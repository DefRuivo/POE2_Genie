import { readFile } from 'fs/promises';
import path from 'path';

const DEFAULT_AI_CONTEXT_FILE_PATH = '.ai/ai-context.local.md';
const DEFAULT_AI_CONTEXT_TEMPLATE_PATH = '.ai/ai-context.template.md';

type ContextReadOptions = {
  warnOnError?: boolean;
  legacyWarnMessage?: boolean;
};

async function readContextFile(
  filePath: string,
  options: ContextReadOptions = {},
): Promise<string | null> {
  const { warnOnError = false, legacyWarnMessage = false } = options;
  try {
    const rawContent = await readFile(filePath, 'utf8');
    const trimmed = rawContent.trim();
    return trimmed || null;
  } catch (error: any) {
    if (warnOnError && error?.code !== 'ENOENT') {
      if (legacyWarnMessage) {
        console.warn(`[AI Context] Failed to read local context file at ${filePath}:`, error);
      } else {
        console.warn(`[AI Context] Failed to read context file at ${filePath}:`, error);
      }
    }
    return null;
  }
}

export async function getLocalAiContext(): Promise<string> {
  const configuredPath = process.env.AI_CONTEXT_FILE_PATH?.trim() || DEFAULT_AI_CONTEXT_FILE_PATH;
  const resolvedPath = path.resolve(process.cwd(), configuredPath);
  const resolvedTemplatePath = path.resolve(process.cwd(), DEFAULT_AI_CONTEXT_TEMPLATE_PATH);

  const configuredContext = await readContextFile(resolvedPath, {
    warnOnError: true,
    legacyWarnMessage: true,
  });
  if (configuredContext) {
    return configuredContext;
  }

  // If no explicit file is set and local context is absent, fallback to committed template.
  if (!process.env.AI_CONTEXT_FILE_PATH?.trim() && resolvedPath !== resolvedTemplatePath) {
    const templateContext = await readContextFile(resolvedTemplatePath);
    if (templateContext) {
      return templateContext;
    }
  }

  return '';
}
