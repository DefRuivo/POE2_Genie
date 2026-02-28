const TOKENS = {
  bg0: '#0f0e0d',
  bg1: '#181512',
  surface1: '#231d19',
  surface2: '#2f2721',
  borderStrong: '#745f49',
  text1: '#f0e4cf',
  text2: '#ccbba0',
  focus: '#9fd0ff',
  sectionParty: '#e17a66',
  sectionChecklist: '#8ecf8e',
  sectionBuilds: '#6fa7ff',
  sectionStash: '#f0c36f',
  sectionHideouts: '#d98f5f',
  sectionSettings: '#9fd0ff',
  success: '#8ecf8e',
  warning: '#f0c36f',
  danger: '#ef9f9f',
} as const;

function toRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map((c) => `${c}${c}`).join('')
    : normalized;
  const value = parseInt(full, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function linearize(channel: number) {
  const v = channel / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const { r, g, b } = toRgb(hex);
  return (
    0.2126 * linearize(r)
    + 0.7152 * linearize(g)
    + 0.0722 * linearize(b)
  );
}

function contrastRatio(a: string, b: string) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

describe('PoE Theme Contrast', () => {
  it('keeps body text pairs at WCAG AA (>= 4.5:1)', () => {
    const pairs: Array<[string, string]> = [
      [TOKENS.text1, TOKENS.bg0],
      [TOKENS.text1, TOKENS.bg1],
      [TOKENS.text1, TOKENS.surface1],
      [TOKENS.text1, TOKENS.surface2],
      [TOKENS.text2, TOKENS.surface1],
      [TOKENS.text2, TOKENS.surface2],
    ];

    for (const [fg, bg] of pairs) {
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps section/status accent text readable on dark surfaces (>= 4.5:1)', () => {
    const accents = [
      TOKENS.sectionParty,
      TOKENS.sectionChecklist,
      TOKENS.sectionBuilds,
      TOKENS.sectionStash,
      TOKENS.sectionHideouts,
      TOKENS.sectionSettings,
      TOKENS.success,
      TOKENS.warning,
      TOKENS.danger,
    ];

    for (const accent of accents) {
      expect(contrastRatio(accent, TOKENS.surface2)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps focus ring and strong borders visible as non-text contrast (>= 3:1)', () => {
    expect(contrastRatio(TOKENS.focus, TOKENS.bg0)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(TOKENS.borderStrong, TOKENS.bg0)).toBeGreaterThanOrEqual(3);
  });
});
