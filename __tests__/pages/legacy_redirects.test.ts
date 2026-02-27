import HideoutMembersRedirectPage from '@/app/hideout-members/page';
import KitchensRedirectPage from '@/app/kitchens/page';
import MembersRedirectPage from '@/app/members/page';
import PantryRedirectPage from '@/app/pantry/page';
import RecipesCreateRedirectPage from '@/app/recipes/create/page';
import RecipesRedirectPage from '@/app/recipes/page';
import BuildItemsRedirectPage from '@/app/build-items/page';
import ShoppingListRedirectPage from '@/app/shopping-list/page';
import GenerateRedirectPage from '@/app/generate/page';
import RecipeDetailsRedirectPage from '@/app/recipes/[id]/page';
import RecipeEditRedirectPage from '@/app/recipes/[id]/edit/page';
import { redirect } from 'next/navigation';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('Legacy route redirects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('/hideout-members redirects to /party', () => {
    HideoutMembersRedirectPage();
    expect(redirect).toHaveBeenCalledWith('/party');
  });

  it('/members redirects to /party', () => {
    MembersRedirectPage();
    expect(redirect).toHaveBeenCalledWith('/party');
  });

  it('/kitchens redirects to /hideouts', () => {
    KitchensRedirectPage();
    expect(redirect).toHaveBeenCalledWith('/hideouts');
  });

  it('/recipes redirects to /builds', () => {
    RecipesRedirectPage();
    expect(redirect).toHaveBeenCalledWith('/builds');
  });

  it('/recipes/create redirects to /builds/create', () => {
    RecipesCreateRedirectPage();
    expect(redirect).toHaveBeenCalledWith('/builds/create');
  });

  it('/generate redirects to /builds/craft', () => {
    GenerateRedirectPage();
    expect(redirect).toHaveBeenCalledWith('/builds/craft');
  });

  it('/pantry redirects to /stash', () => {
    PantryRedirectPage();
    expect(redirect).toHaveBeenCalledWith('/stash');
  });

  it('/build-items redirects to /checklist', () => {
    BuildItemsRedirectPage();
    expect(redirect).toHaveBeenCalledWith('/checklist');
  });

  it('/shopping-list redirects to /checklist', () => {
    ShoppingListRedirectPage();
    expect(redirect).toHaveBeenCalledWith('/checklist');
  });

  it('/recipes/[id] redirects to /builds/[id]', async () => {
    await RecipeDetailsRedirectPage({ params: Promise.resolve({ id: 'abc' }) });
    expect(redirect).toHaveBeenCalledWith('/builds/abc');
  });

  it('/recipes/[id]/edit redirects to /builds/[id]/edit', async () => {
    await RecipeEditRedirectPage({ params: Promise.resolve({ id: 'abc' }) });
    expect(redirect).toHaveBeenCalledWith('/builds/abc/edit');
  });
});
