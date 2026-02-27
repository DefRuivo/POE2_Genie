import { readFileSync } from 'fs';
import path from 'path';

import {
  parseAllPoeClipboardItems,
  parseFirstPoeClipboardItem,
  parseFirstPoeClipboardItemWithDetails,
} from '@/lib/poe-item-parser';

function readExample(filename: string): string {
  return readFileSync(path.join(process.cwd(), 'item_examples', filename), 'utf-8');
}

describe('poe-item-parser', () => {
  it('parses skill gem clipboard and extracts name', () => {
    const parsed = parseFirstPoeClipboardItem(readExample('skill_gem.md'));
    expect(parsed).toEqual({
      name: 'Permafrost Bolts',
      quantity: '1',
      unit: 'x',
    });
  });

  it('parses support gem clipboard and extracts name', () => {
    const parsed = parseFirstPoeClipboardItem(readExample('support_gem.md'));
    expect(parsed).toEqual({
      name: 'Zenith II',
      quantity: '1',
      unit: 'x',
    });
  });

  it('parses body armour clipboard and uses rare name + base type', () => {
    const parsed = parseFirstPoeClipboardItem(readExample('body_armour.md'));
    expect(parsed).toEqual({
      name: 'Gloom Guardian (Sleek Jacket)',
      quantity: '1',
      unit: 'x',
    });
  });

  it('returns null for invalid clipboard text', () => {
    expect(parseFirstPoeClipboardItem('not an item')).toBeNull();
  });

  it('parses all valid items and keeps first-item behavior available', () => {
    const combinedClipboard = [
      readExample('support_gem.md'),
      readExample('skill_gem.md'),
      'invalid section',
    ].join('\n\n');

    const all = parseAllPoeClipboardItems(combinedClipboard);
    expect(all).toEqual([
      { name: 'Zenith II', quantity: '1', unit: 'x' },
      { name: 'Permafrost Bolts', quantity: '1', unit: 'x' },
    ]);

    const firstDetailed = parseFirstPoeClipboardItemWithDetails(combinedClipboard);
    expect(firstDetailed?.name).toBe('Zenith II');
    expect(firstDetailed?.itemClass).toBe('Support Gems');
    expect(firstDetailed?.rarity).toBe('Gem');
  });
});

