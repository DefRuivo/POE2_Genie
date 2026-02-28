export const ICON_MAP = {
  brand: 'fas fa-wand-magic-sparkles',
  home: 'fas fa-compass',
  stash: 'fas fa-box-open',
  checklist: 'fas fa-list-check',
  builds: 'fas fa-scroll',
  party: 'fas fa-users',
  hideouts: 'fas fa-campground',
  settings: 'fas fa-cog',
  invite: 'fas fa-ticket-alt',
} as const;

export type IconKey = keyof typeof ICON_MAP;

export const ICON_ACCENT_CLASS: Record<IconKey, string> = {
  brand: 'text-poe-gold',
  home: 'text-poe-gold',
  stash: 'text-poe-sectionStash',
  checklist: 'text-poe-sectionChecklist',
  builds: 'text-poe-sectionBuilds',
  party: 'text-poe-sectionParty',
  hideouts: 'text-poe-sectionHideouts',
  settings: 'text-poe-sectionSettings',
  invite: 'text-poe-sectionHideouts',
};
