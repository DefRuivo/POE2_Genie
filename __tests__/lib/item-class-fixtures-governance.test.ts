import { existsSync, readFileSync } from 'fs';
import path from 'path';

import { parseFirstPoeClipboardItem } from '@/lib/poe-item-parser';

type ManifestEntry = {
  itemClass: string;
  status: 'confirmed' | 'candidate';
  source: {
    origin: string;
    url: string;
  };
  priority: 'high' | 'medium';
  fixtureFile: string;
};

type ItemClassManifest = {
  snapshotDate: string;
  confirmedOfficial: ManifestEntry[];
  confirmedCommunity: ManifestEntry[];
  confirmedLocalFixtures: ManifestEntry[];
  candidatesPendingValidation: ManifestEntry[];
};

function loadManifest(): ItemClassManifest {
  const manifestPath = path.join(process.cwd(), 'item_examples', '_item_classes_manifest.json');
  const raw = readFileSync(manifestPath, 'utf-8');
  return JSON.parse(raw) as ItemClassManifest;
}

function readFixture(file: string): string {
  return readFileSync(path.join(process.cwd(), 'item_examples', file), 'utf-8');
}

describe('item class fixtures governance', () => {
  it('keeps all confirmed classes mapped to existing fixture files', () => {
    const manifest = loadManifest();
    const confirmed = [
      ...manifest.confirmedOfficial,
      ...manifest.confirmedCommunity,
      ...manifest.confirmedLocalFixtures,
    ];

    for (const entry of confirmed) {
      const fixturePath = path.join(process.cwd(), 'item_examples', entry.fixtureFile);
      expect(existsSync(fixturePath)).toBe(true);
      expect(entry.status).toBe('confirmed');
      expect(entry.priority).toBe('high');
    }
  });

  it('parses every confirmed fixture into a non-empty stash name', () => {
    const manifest = loadManifest();
    const confirmed = [
      ...manifest.confirmedOfficial,
      ...manifest.confirmedCommunity,
      ...manifest.confirmedLocalFixtures,
    ];

    for (const entry of confirmed) {
      const parsed = parseFirstPoeClipboardItem(readFixture(entry.fixtureFile));
      expect(parsed).not.toBeNull();
      expect(parsed?.name.trim().length).toBeGreaterThan(0);
    }
  });

  it('keeps candidate fixtures prefixed and ignores invalid candidate block without breaking valid parse', () => {
    const manifest = loadManifest();
    for (const entry of manifest.candidatesPendingValidation) {
      expect(entry.status).toBe('candidate');
      expect(entry.priority).toBe('medium');
      expect(entry.fixtureFile.startsWith('candidate_')).toBe(true);
      const fixturePath = path.join(process.cwd(), 'item_examples', entry.fixtureFile);
      expect(existsSync(fixturePath)).toBe(true);
    }

    const invalidCandidate = readFixture('candidate_relics.md');
    expect(parseFirstPoeClipboardItem(invalidCandidate)).toBeNull();

    const validFixture = readFixture('support_gem.md');
    const combined = `${invalidCandidate}\n\n${validFixture}`;
    const parsed = parseFirstPoeClipboardItem(combined);
    expect(parsed?.name).toBe('Zenith II');
  });
});

