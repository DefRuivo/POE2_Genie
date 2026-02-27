import { writeFile } from 'fs/promises';
import path from 'path';
import { prisma } from '../lib/prisma.ts';
import { assessTextDomain } from '../lib/domain-guardrails.ts';

type CliOptions = {
  dryRun: boolean;
  allHideouts: boolean;
  hideoutId?: string;
  reportFile?: string;
};

type HideoutReport = {
  hideoutId: string;
  hideoutName: string;
  recipeIdsToDelete: string[];
  shoppingItemIdsToDelete: string[];
  ingredientIdsToDelete: string[];
  pantryItemIdsToDelete: string[];
  samples: {
    recipes: string[];
    shoppingItems: string[];
    ingredients: string[];
    pantryItems: string[];
  };
};

type CleanupReport = {
  mode: 'dry-run' | 'apply';
  generatedAt: string;
  options: CliOptions;
  summary: {
    hideoutsScanned: number;
    recipesMarked: number;
    shoppingItemsMarked: number;
    ingredientsMarked: number;
    pantryItemsMarked: number;
  };
  hideouts: HideoutReport[];
};

const parseArgs = (args: string[]): CliOptions => {
  const apply = args.includes('--apply');
  const hideoutArg = args.find((arg) => arg.startsWith('--hideout-id='));
  const reportArg = args.find((arg) => arg.startsWith('--report-file='));

  const hideoutId = hideoutArg ? hideoutArg.split('=')[1]?.trim() : undefined;
  const reportFile = reportArg ? reportArg.split('=').slice(1).join('=').trim() : undefined;

  return {
    dryRun: !apply,
    allHideouts: !hideoutId,
    hideoutId: hideoutId || undefined,
    reportFile: reportFile || undefined,
  };
};

const isLikelyCulinary = (text: string): boolean => {
  const assessment = assessTextDomain(text);
  return assessment.isCulinaryLikely;
};

const compactRecipeText = (recipe: {
  recipe_title: string;
  analysis_log: string;
  match_reasoning: string;
  meal_type: string;
  difficulty: string;
}) =>
  [
    recipe.recipe_title,
    recipe.analysis_log,
    recipe.match_reasoning,
    recipe.meal_type,
    recipe.difficulty,
  ]
    .filter(Boolean)
    .join('\n');

async function collectHideoutReport(hideoutId: string, hideoutName: string): Promise<HideoutReport> {
  const recipes = await prisma.recipe.findMany({
    where: { kitchenId: hideoutId },
    select: {
      id: true,
      recipe_title: true,
      analysis_log: true,
      match_reasoning: true,
      meal_type: true,
      difficulty: true,
    },
  });

  const recipeIdsToDelete = recipes
    .filter((recipe) => isLikelyCulinary(compactRecipeText(recipe)))
    .map((recipe) => recipe.id);
  const recipeIdSet = new Set(recipeIdsToDelete);

  const shoppingItems = await prisma.shoppingItem.findMany({
    where: { kitchenId: hideoutId },
    select: {
      id: true,
      name: true,
      recipeItems: {
        select: { recipeId: true },
      },
    },
  });

  const shoppingItemIdsToDelete = shoppingItems
    .filter((item) => {
      if (!isLikelyCulinary(item.name)) return false;
      const remainingLinks = item.recipeItems.filter((ref) => !recipeIdSet.has(ref.recipeId)).length;
      return remainingLinks === 0;
    })
    .map((item) => item.id);

  const ingredients = await prisma.ingredient.findMany({
    where: { kitchenId: hideoutId },
    select: {
      id: true,
      name: true,
      recipeIngredients: {
        select: { recipeId: true },
      },
    },
  });

  const ingredientIdsToDelete = ingredients
    .filter((ingredient) => {
      if (!isLikelyCulinary(ingredient.name)) return false;
      const remainingLinks = ingredient.recipeIngredients.filter((ref) => !recipeIdSet.has(ref.recipeId)).length;
      return remainingLinks === 0;
    })
    .map((ingredient) => ingredient.id);

  const pantryItems = await prisma.pantryItem.findMany({
    where: { kitchenId: hideoutId },
    select: { id: true, name: true },
  });

  const pantryItemIdsToDelete = pantryItems
    .filter((item) => isLikelyCulinary(item.name))
    .map((item) => item.id);

  return {
    hideoutId,
    hideoutName,
    recipeIdsToDelete,
    shoppingItemIdsToDelete,
    ingredientIdsToDelete,
    pantryItemIdsToDelete,
    samples: {
      recipes: recipes
        .filter((recipe) => recipeIdsToDelete.includes(recipe.id))
        .slice(0, 10)
        .map((recipe) => recipe.recipe_title),
      shoppingItems: shoppingItems
        .filter((item) => shoppingItemIdsToDelete.includes(item.id))
        .slice(0, 10)
        .map((item) => item.name),
      ingredients: ingredients
        .filter((item) => ingredientIdsToDelete.includes(item.id))
        .slice(0, 10)
        .map((item) => item.name),
      pantryItems: pantryItems
        .filter((item) => pantryItemIdsToDelete.includes(item.id))
        .slice(0, 10)
        .map((item) => item.name),
    },
  };
}

async function applyHideoutCleanup(report: HideoutReport) {
  await prisma.$transaction(async (tx) => {
    if (report.recipeIdsToDelete.length > 0) {
      await tx.recipe.deleteMany({ where: { id: { in: report.recipeIdsToDelete } } });
    }

    if (report.pantryItemIdsToDelete.length > 0) {
      await tx.pantryItem.deleteMany({ where: { id: { in: report.pantryItemIdsToDelete } } });
    }

    if (report.shoppingItemIdsToDelete.length > 0) {
      await tx.shoppingItem.deleteMany({ where: { id: { in: report.shoppingItemIdsToDelete } } });
    }

    if (report.ingredientIdsToDelete.length > 0) {
      await tx.ingredient.deleteMany({ where: { id: { in: report.ingredientIdsToDelete } } });
    }
  });
}

function summarize(hideouts: HideoutReport[]) {
  return {
    hideoutsScanned: hideouts.length,
    recipesMarked: hideouts.reduce((acc, item) => acc + item.recipeIdsToDelete.length, 0),
    shoppingItemsMarked: hideouts.reduce((acc, item) => acc + item.shoppingItemIdsToDelete.length, 0),
    ingredientsMarked: hideouts.reduce((acc, item) => acc + item.ingredientIdsToDelete.length, 0),
    pantryItemsMarked: hideouts.reduce((acc, item) => acc + item.pantryItemIdsToDelete.length, 0),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const hideouts = options.allHideouts
    ? await prisma.kitchen.findMany({ select: { id: true, name: true }, orderBy: { createdAt: 'asc' } })
    : options.hideoutId
      ? await prisma.kitchen.findMany({ where: { id: options.hideoutId }, select: { id: true, name: true } })
      : [];

  if (hideouts.length === 0) {
    console.log('[cleanup-culinary-legacy] No hideouts found for the selected scope.');
    return;
  }

  const hideoutReports: HideoutReport[] = [];

  for (const hideout of hideouts) {
    const report = await collectHideoutReport(hideout.id, hideout.name);
    hideoutReports.push(report);

    if (!options.dryRun) {
      await applyHideoutCleanup(report);
    }
  }

  const report: CleanupReport = {
    mode: options.dryRun ? 'dry-run' : 'apply',
    generatedAt: new Date().toISOString(),
    options,
    summary: summarize(hideoutReports),
    hideouts: hideoutReports,
  };

  console.log('[cleanup-culinary-legacy] Mode:', report.mode);
  console.log('[cleanup-culinary-legacy] Hideouts scanned:', report.summary.hideoutsScanned);
  console.log('[cleanup-culinary-legacy] Recipes marked:', report.summary.recipesMarked);
  console.log('[cleanup-culinary-legacy] Shopping items marked:', report.summary.shoppingItemsMarked);
  console.log('[cleanup-culinary-legacy] Ingredients marked:', report.summary.ingredientsMarked);
  console.log('[cleanup-culinary-legacy] Pantry items marked:', report.summary.pantryItemsMarked);

  if (options.reportFile) {
    const reportPath = path.resolve(process.cwd(), options.reportFile);
    await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log('[cleanup-culinary-legacy] Report written to:', reportPath);
  } else {
    console.log(JSON.stringify(report, null, 2));
  }
}

main()
  .catch((error) => {
    console.error('[cleanup-culinary-legacy] Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
