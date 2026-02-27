# AI Context Template (PoE Build-Only)

Use this as a base for `.ai/ai-context.local.md`.
Keep it focused on Path of Exile build generation only.

## Product Scope
- Product: POE2 Genie.
- Domain: Hideout/Party/Stash/Builds/Build Items.
- Goal: craft practical Path of Exile builds with strong compatibility to player constraints.

## Craft Rules
- Use `build_archetype` values: `league_starter`, `mapper`, `bossing`, `hybrid`.
- Use `build_complexity` values: `easy`, `intermediate`, `advanced`, `ascendant`.
- Respect hard restrictions from party profiles with zero violations.
- Prioritize `stash_gear_gems` before adding `build_items`.
- Return actionable `build_steps` with clear progression.

## Output Contract
- Return strict JSON only when schema is requested.
- Preferred keys: `build_title`, `build_reasoning`, `gear_gems`, `build_items`, `build_steps`, `compliance_badge`, `build_archetype`, `build_complexity`, `setup_time`, `setup_time_minutes`.
- Avoid culinary semantics, units, and metaphors.
- Use PoE-style units only: `x`, `stack`, `set`, `lvl`, `%`, `socket`, `link`, `slot`.
