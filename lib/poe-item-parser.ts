export interface ParsedStashImport {
  name: string;
  quantity: '1';
  unit: 'x';
}

export interface ParsedStashImportDetailed extends ParsedStashImport {
  itemClass?: string;
  rarity?: string;
  baseType?: string;
  rawLines?: string[];
}

const ITEM_CLASS_PREFIX = 'Item Class:';
const RARITY_PREFIX = 'Rarity:';
const SECTION_SEPARATOR = '--------';
const DEFAULT_QUANTITY: '1' = '1';
const DEFAULT_UNIT: 'x' = 'x';

const METADATA_PREFIXES = [
  'Quality:',
  'Armour:',
  'Evasion Rating:',
  'Energy Shield:',
  'Ward:',
  'Requires:',
  'Sockets:',
  'Item Level:',
  'Level:',
  'Cost:',
  'Critical Hit Chance:',
  'Attacks per Second:',
  'Physical Damage:',
  'Elemental Damage:',
  'Spirit:',
];

function normalizeClipboardText(text: string): string {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .trim();
}

function splitPotentialItemBlocks(text: string): string[] {
  const normalized = normalizeClipboardText(text);
  if (!normalized) return [];
  return normalized
    .split(/(?=^Item Class:\s*)/gim)
    .map((block) => block.trim())
    .filter(Boolean);
}

function isMetadataLine(line: string): boolean {
  const normalized = line.trim();
  return METADATA_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function extractNominalLines(lines: string[], rarityIndex: number): string[] {
  const linesAfterRarity = lines.slice(rarityIndex + 1);
  const separatorIndex = linesAfterRarity.findIndex((line) => line === SECTION_SEPARATOR);
  const headerLines = separatorIndex >= 0
    ? linesAfterRarity.slice(0, separatorIndex)
    : linesAfterRarity;

  return headerLines
    .map((line) => line.trim())
    .filter((line) => !!line && !isMetadataLine(line));
}

function parseSingleItemBlockWithDetails(block: string): ParsedStashImportDetailed | null {
  const normalizedBlock = normalizeClipboardText(block);
  if (!normalizedBlock) return null;

  const lines = normalizedBlock
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const itemClassIndex = lines.findIndex((line) => line.startsWith(ITEM_CLASS_PREFIX));
  const rarityIndex = lines.findIndex((line) => line.startsWith(RARITY_PREFIX));
  if (itemClassIndex === -1 || rarityIndex === -1) return null;

  const itemClass = lines[itemClassIndex].slice(ITEM_CLASS_PREFIX.length).trim();
  const rarity = lines[rarityIndex].slice(RARITY_PREFIX.length).trim();
  if (!itemClass || !rarity) return null;

  const nominalLines = extractNominalLines(lines, rarityIndex);
  if (nominalLines.length === 0) return null;

  const normalizedRarity = rarity.toLowerCase();
  const isGem = normalizedRarity === 'gem';
  const isUnique = normalizedRarity === 'unique';
  const primaryName = nominalLines[0];
  if (!primaryName) return null;

  const baseType = nominalLines[1];
  const name = !isGem && !isUnique && baseType
    ? `${primaryName} (${baseType})`
    : primaryName;

  if (!name.trim()) return null;

  return {
    name: name.trim(),
    quantity: DEFAULT_QUANTITY,
    unit: DEFAULT_UNIT,
    itemClass,
    rarity,
    baseType,
    rawLines: lines,
  };
}

export function parseFirstPoeClipboardItem(text: string): ParsedStashImport | null {
  const first = parseFirstPoeClipboardItemWithDetails(text);
  if (!first) return null;
  return {
    name: first.name,
    quantity: DEFAULT_QUANTITY,
    unit: DEFAULT_UNIT,
  };
}

export function parseFirstPoeClipboardItemWithDetails(text: string): ParsedStashImportDetailed | null {
  const blocks = splitPotentialItemBlocks(text);
  for (const block of blocks) {
    const parsed = parseSingleItemBlockWithDetails(block);
    if (parsed) return parsed;
  }
  return null;
}

export function parseAllPoeClipboardItems(text: string): ParsedStashImport[] {
  // Future roadmap: wire this up in the UI for multi-item import in one paste action.
  const blocks = splitPotentialItemBlocks(text);
  return blocks
    .map((block) => parseSingleItemBlockWithDetails(block))
    .filter((parsed): parsed is ParsedStashImportDetailed => parsed !== null)
    .map((parsed) => ({
      name: parsed.name,
      quantity: DEFAULT_QUANTITY,
      unit: DEFAULT_UNIT,
    }));
}

