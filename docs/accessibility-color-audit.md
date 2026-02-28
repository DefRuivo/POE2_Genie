# Accessibility Color Audit (PoE Dark)

## Goal
- WCAG 2.2 AA for text contrast (`>= 4.5:1`).
- Non-text contrast for focus/borders (`>= 3:1`).
- Section differentiation by marker + icon + title (not color only).

## Section Matrix
- `Home`: marker + icon + counters with section accent.
- `Party`: section marker (`poe-section-party`) + `fa-users`.
- `Builds`: section marker (`poe-section-builds`) + `fa-scroll`/`fa-book-open`.
- `Stash`: section marker (`poe-section-stash`) + `fa-box-open`.
- `Checklist`: section marker (`poe-section-checklist`) + `fa-list-check`.
- `Hideouts`: section marker (`poe-section-hideouts`) + `fa-house`.
- `Settings`: section marker (`poe-section-settings`) + `fa-cog`.
- `Auth`: PoE surface cards + AA-safe inputs/buttons.

## Interaction Checklist
- Inputs/selects/buttons use `poe-focus-ring`.
- Status feedback uses semantic classes:
  - `poe-status-success`
  - `poe-status-warning`
  - `poe-status-danger`
  - `poe-status-info`
- Section accents use soft variants:
  - `poe-accent-party-soft`
  - `poe-accent-checklist-soft`
  - `poe-accent-builds-soft`
  - `poe-accent-stash-soft`
  - `poe-accent-settings-soft`

## Regression Guard
- Automated contrast validation: [`__tests__/styles/color-contrast.test.ts`](/root/POE2_Genie/__tests__/styles/color-contrast.test.ts)
- Run with quality gates:
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build`
