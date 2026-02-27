import { existsSync, readFileSync } from 'fs';
import path from 'path';

import { parseFirstPoeClipboardItem } from '@/lib/poe-item-parser';

type UniqueManifestEntry = {
  itemClass: string;
  fixtureFile: string;
  expectedName: string;
  sourceUrl: string;
  sourceType: 'poe2db' | 'synthetic_temp';
  validationStatus: 'verified' | 'pending_real_clipboard';
};

type UniqueManifest = {
  snapshotDate: string;
  entries: UniqueManifestEntry[];
};

const EXPECTED_CLASSES = [
  'Amulets',
  'Belts',
  'Body Armours',
  'Boots',
  'Bows',
  'Bucklers',
  'Charms',
  'Crossbows',
  'Foci',
  'Gloves',
  'Helmets',
  'Life Flasks',
  'Mana Flasks',
  'One Hand Maces',
  'Quarterstaves',
  'Quivers',
  'Rings',
  'Sceptres',
  'Shields',
  'Spears',
  'Staves',
  'Two Hand Maces',
  'Wands',
];

function loadManifest(): UniqueManifest {
  const manifestPath = path.join(process.cwd(), 'item_examples', '_unique_item_examples_manifest.json');
  const raw = readFileSync(manifestPath, 'utf-8');
  return JSON.parse(raw) as UniqueManifest;
}

function readFixture(file: string): string {
  return readFileSync(path.join(process.cwd(), 'item_examples', file), 'utf-8');
}

describe('unique item fixtures governance', () => {
  it('covers exactly the 23 equipment classes in confirmedCommunity', () => {
    const manifest = loadManifest();
    const classList = manifest.entries.map((entry) => entry.itemClass).sort();
    expect(classList).toHaveLength(23);
    expect(classList).toEqual([...EXPECTED_CLASSES].sort());
  });

  it('has existing fixtures and parser output matches expected unique name', () => {
    const manifest = loadManifest();

    for (const entry of manifest.entries) {
      const fixturePath = path.join(process.cwd(), 'item_examples', entry.fixtureFile);
      expect(existsSync(fixturePath)).toBe(true);

      const parsed = parseFirstPoeClipboardItem(readFixture(entry.fixtureFile));
      expect(parsed).not.toBeNull();
      expect(parsed?.name).toBe(entry.expectedName);
    }
  });

  it('limits synthetic temporary sources to Charms and Mana Flasks only', () => {
    const manifest = loadManifest();
    const synthetic = manifest.entries.filter((entry) => entry.sourceType === 'synthetic_temp');
    expect(synthetic).toHaveLength(2);

    const syntheticClasses = synthetic.map((entry) => entry.itemClass).sort();
    expect(syntheticClasses).toEqual(['Charms', 'Mana Flasks']);

    for (const entry of synthetic) {
      expect(entry.validationStatus).toBe('pending_real_clipboard');
    }
  });

  it('requires non-synthetic entries to be verified and point to poe2db', () => {
    const manifest = loadManifest();

    for (const entry of manifest.entries.filter((value) => value.sourceType === 'poe2db')) {
      expect(entry.validationStatus).toBe('verified');
      expect(entry.sourceUrl.startsWith('https://poe2db.tw/us/')).toBe(true);
    }
  });
});
