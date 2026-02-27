# Unique Item Validation Checklist (PoE2)

Source baseline:
- https://poe2db.tw/us/Unique_item
- https://www.poe2wiki.net/wiki/Unique_item

Use this checklist to confirm each fixture against a public page before promoting data quality gates.

| Class | Fixture | Expected Name | Source Type | Validation Status |
| --- | --- | --- | --- | --- |
| Amulets | `unique_amulets.md` | The Everlasting Gaze | poe2db | verified |
| Belts | `unique_belts.md` | Coward's Legacy | poe2db | verified |
| Body Armours | `unique_body_armours.md` | Deepest Tower | poe2db | verified |
| Boots | `unique_boots.md` | Seven-League Step | poe2db | verified |
| Bows | `unique_bows.md` | Death's Harp | poe2db | verified |
| Bucklers | `unique_bucklers.md` | Horned Barrier | poe2db | verified |
| Charms | `synthetic_unique_charms.md` | Synthetic Charm Prototype | synthetic_temp | pending_real_clipboard |
| Crossbows | `unique_crossbows.md` | Gaslantern's | poe2db | verified |
| Foci | `unique_foci.md` | Ayah of Tawho'a | poe2db | verified |
| Gloves | `unique_gloves.md` | Snakebite | poe2db | verified |
| Helmets | `unique_helmets.md` | Alpha's Howl | poe2db | verified |
| Life Flasks | `unique_life_flasks.md` | Olroth's Resolve | poe2db | verified |
| Mana Flasks | `synthetic_unique_mana_flasks.md` | Synthetic Mana Flask Prototype | synthetic_temp | pending_real_clipboard |
| One Hand Maces | `unique_one_hand_maces.md` | Echoing Etchings | poe2db | verified |
| Quarterstaves | `unique_quarterstaves.md` | Pillar of the Caged God | poe2db | verified |
| Quivers | `unique_quivers.md` | Maloney's Nightfall | poe2db | verified |
| Rings | `unique_rings.md` | Dream Fragments | poe2db | verified |
| Sceptres | `unique_sceptres.md` | Font of Power | poe2db | verified |
| Shields | `unique_shields.md` | The Surrender | poe2db | verified |
| Spears | `unique_spears.md` | The Last Lament | poe2db | verified |
| Staves | `unique_staves.md` | Atziri's Disdain | poe2db | verified |
| Two Hand Maces | `unique_two_hand_maces.md` | Wings of Caelyn | poe2db | verified |
| Wands | `unique_wands.md` | Lifesprig | poe2db | verified |

## Promotion rule for temporary synthetic fixtures

1. Replace `synthetic_unique_charms.md` and `synthetic_unique_mana_flasks.md` with real clipboard captures.
2. Update `_unique_item_examples_manifest.json` `sourceType` to `poe2db`.
3. Set `validationStatus` to `verified`.
