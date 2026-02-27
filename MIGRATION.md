# PoE Canonical-First Migration Guide

This project now treats canonical PoE routes as the runtime source of truth.
Legacy routes remain available temporarily with `Deprecation` and `Sunset` headers.

## Page Routes

| Legacy | Canonical |
| --- | --- |
| `/members` | `/party` |
| `/hideout-members` | `/party` |
| `/recipes` | `/builds` |
| `/recipes/[id]` | `/builds/[id]` |
| `/recipes/[id]/edit` | `/builds/[id]/edit` |
| `/recipes/create` | `/builds/create` |
| `/generate` | `/builds/craft` |
| `/pantry` | `/stash` |
| `/build-items` | `/checklist` |
| `/shopping-list` | `/checklist` |
| `/kitchens` | `/hideouts` |

## API Routes

| Legacy | Canonical |
| --- | --- |
| `/api/recipe` | `/api/build` |
| `/api/recipes` | `/api/builds` |
| `/api/recipes/[id]` | `/api/builds/[id]` |
| `/api/recipes/[id]/favorite` | `/api/builds/[id]/favorite` |
| `/api/recipes/[id]/translate` | `/api/builds/[id]/translate` |
| `/api/pantry` | `/api/stash` |
| `/api/pantry/[name]` | `/api/stash/[name]` |
| `/api/shopping-list` | `/api/checklist` |
| `/api/shopping-list/[id]` | `/api/checklist/[id]` |
| `/api/build-items` | `/api/checklist` |
| `/api/build-items/[id]` | `/api/checklist/[id]` |
| `/api/kitchen-members` | `/api/party-members` |
| `/api/kitchen-members/[id]` | `/api/party-members/[id]` |
| `/api/hideout-members` | `/api/party-members` |
| `/api/hideout-members/[id]` | `/api/party-members/[id]` |
| `/api/kitchens` | `/api/hideouts` |
| `/api/kitchens/[kitchenId]` | `/api/hideouts/[hideoutId]` |
| `/api/kitchens/join` | `/api/hideouts/join` |

## Service Methods

Use canonical `storageService` methods:

- `getAllBuilds`, `saveBuild`, `getBuildById`, `deleteBuild`, `toggleBuildFavorite`
- `getPartyMembers`, `savePartyMember`, `deletePartyMember`
- `getStash`, `addStashItem`, `editStashItem`, `removeStashItem`
- `getBuildItems`, `addBuildItem`, `updateBuildItem`, `deleteBuildItem`, `clearBuildItems`
- `getCurrentHideout`, `createHideout`, `joinHideout`, `switchHideout`, `updateHideout`, `deleteHideout`, `leaveHideout`

Legacy wrappers remain available for compatibility during the transition window.
