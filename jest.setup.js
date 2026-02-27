
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

if (!global.Request) {
    global.Request = class Request {
        constructor(input, init) {
            this.input = input;
            this.init = init;
            this.headers = new Headers(init?.headers);
        }
        async json() {
            return JSON.parse(this.init?.body || '{}');
        }
    };
}
if (!global.Response) {
    global.Response = class Response {
        constructor(body, init) {
            this.body = body;
            this.status = init?.status || 200;
            this.ok = this.status >= 200 && this.status < 300;
            this.headers = new Headers(init?.headers);
        }
        async json() {
            return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
        }
        static json(data, init) {
            return new Response(JSON.stringify(data), init);
        }
    };
}
if (!global.Headers) {
    global.Headers = class Headers {
        constructor(init) {
            this.map = new Map(Object.entries(init || {}));
        }
        get(name) { return this.map.get(name); }
        set(name, value) { this.map.set(name, value); }
    };
}

const translations = {
  en: {
    common: {
      delete: 'Delete',
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      back: 'Back',
      loading: 'Loading...',
      slogan: 'Smart Build Intelligence for Exiles'
    },
    nav: {
      home: 'Home',
      pantry: 'Stash',
      recipes: 'Builds',
      history: 'History',
      shopping: 'Checklist',
      members: 'Party',
      kitchens: 'Manage Hideouts',
      settings: 'Settings',
      account: 'Account',
      logout: 'Log Out',
      switchKitchen: 'Switch Hideout',
      newKitchen: 'New Hideout'
    },
    home: {
      welcome: 'Welcome back',
      generateRecipe: 'Craft Build',
      pantry: 'Stash',
      activeKitchen: 'Active Hideout',
      quickActions: 'Quick Actions',
      joinKitchen: 'Join Hideout',
      createKitchen: 'Create Hideout'
    },
    shopping: {
      addItem: 'Add item...',
      title: 'Checklist',
      subtitle: 'Smart checklist for items needed by your builds.',
      loading: 'Loading List...',
      empty: 'All caught up!',
      readOnly: 'Checklist is shared for the Hideout (Read Only)',
      fromPantry: 'From Stash',
      forRecipes: 'For {n} Build(s)',
      clearAll: 'Clear List',
      searchPlaceholder: 'Search checklist...',
      filterAll: 'All',
      filterMyList: 'Manual',
      filterRecipes: 'Builds',
      allRecipes: 'All Builds',
      noResults: 'No items found',
      pendingTab: 'Pending',
      completedTab: 'Completed',
      pendingHelp: 'Items still needed for your builds.',
      completedHelp: 'Items already acquired and marked.',
      markAsBought: 'Mark as Completed',
      reopenItem: 'Reopen to Pending',
      statusPending: 'Pending',
      statusCompleted: 'Completed',
      emptyPending: 'No pending checklist items.',
      emptyCompleted: 'No completed checklist items yet.'
    },
    recipes: {
      view: 'View Build',
      delete: 'Delete',
      deleteTitle: 'Delete Build?',
      deleteDesc: 'This action cannot be undone. Are you sure you want to delete this build?',
      searchPlaceholder: 'Search by title or gear/gem...',
      noResults: 'No builds found',
      noResultsSearch: 'No results for "{term}". Try another keyword!',
      empty: 'You haven\'t saved any builds yet. Craft one to get started!'
    },
    recipeForm: {
      titleCreate: 'Create Build',
      titleEdit: 'Edit Build',
      recipeTitle: 'Build Title',
      recipeTitlePlaceholder: "Build Title (e.g. Arc League Starter)",
      mealType: 'Build Archetype',
      leagueStarter: 'League Starter',
      mapper: 'Mapper',
      bossing: 'Bossing',
      hybrid: 'Hybrid',
      mainCourse: 'League Starter',
      appetizer: 'Mapper',
      dessert: 'Bossing',
      snack: 'Hybrid',
      difficulty: 'Custos',
      costs: 'Custos',
      easy: 'Barato',
      intermediate: 'Médio',
      advanced: 'Caro',
      chefMode: 'Mirror of Kalandra',
      ascendant: 'Mirror of Kalandra',
      cheap: 'Barato',
      medium: 'Médio',
      expensive: 'Caro',
      mirrorOfKalandra: 'Mirror of Kalandra',
      costTooltipCheap: 'Até 1 Divino',
      costTooltipMedium: 'De 1 a 10 Divinos',
      costTooltipExpensive: 'De 10 a 100 Divinos',
      costTooltipMirrorOfKalandra: '1+ Espelhos de Kalandra',
      prepTime: 'Setup Time',
      prepTimePlaceholder: 'Setup Time (e.g. 45 min)',
      recipeIdeaPlaceholder: 'e.g. Pasta with tomato sauce',
      ingredients: 'Gear/Gems (Stash/Hideout)',
      qty: 'Qty',
      unit: 'Unit',
      ingredientName: 'Gear/Gem Name',
      add: 'Add',
      shoppingList: 'Checklist (Missing)',
      itemName: 'Item Name',
      instructions: 'Build Instructions',
      stepPlaceholder: 'Step {n} instructions...',
      addStep: 'Add Step',
      saveRecipe: 'Save Build',
      saving: 'Saving...'
    },
    units: {
      x: 'x',
      stack: 'Stack',
      set: 'Set',
      lvl: 'Lvl',
      '%': '%',
      socket: 'Socket',
      link: 'Link',
      slot: 'Slot',
      package: 'package',
      kg: 'kg',
      cup: 'cup'
    },
    recipeCard: {
      todaysSuggestion: 'Today\'s Build',
      chef: 'Mirror of Kalandra',
      time: 'Time',
      difficulty: 'Difficulty',
      calories: 'Calories',
      ingredients: 'Ingredients',
      instructions: 'Instructions',
      addToShoppingList: 'Add to Checklist',
      favorite: 'Favorite',
      unfavorite: 'Unfavorite',
      translate: 'Translate Build',
      showOriginal: 'Show Original',
      translating: 'Translating...',
      fromPantry: 'From Stash',
      toBuy: 'Missing Items',
      stepByStep: 'Build Steps',
      addToListTitle: 'Add "{item}" to List?',
      trackItem: 'Select how to track this item',
      alwaysReplenish: 'Always Replenish',
      oneShot: 'One Shot',
      justTrack: 'Just Track',
      cancel: 'Cancel',
      copyClipboard: 'Copy to Clipboard',
      copied: 'Copied!'
    },
    generate: {
      specialRequestsPlaceholder: 'e.g. I have 20 minutes, use the oven...',
      title: 'Craft Build',
      whoIsEating: 'Who is in this party?',
      mealType: 'Build Archetype',
      difficulty: 'Custos',
      costs: 'Custos',
      specialRequests: 'Any special requests?',
      generateBtn: 'Craft Build'
    },
    members: {
      title: 'Party',
      addMember: 'Add Mercenary / Party Member',
      editMember: 'Edit Party Member',
      invite: 'Invite Party Member',
      role: 'Role',
      likes: 'Likes',
      likesPlaceholder: 'e.g. Italian, Spicy',
      dislikes: 'Dislikes',
      restrictions: 'Dietary Restrictions',
      guestViewTitle: 'You are viewing this hideout as a Mercenary.',
      guestViewDesc: 'Select your profile below to update your preferences.',
      none: 'None',
      safe: 'Safe',
      member: 'Member',
      linked: 'Linked',
      name: 'Name',
      namePlaceholder: 'e.g. Grandma, Mike',
      emailOptional: 'Email (Optional)',
      emailPlaceholder: 'invite@example.com'
    },
    pantry: {
      title: 'Stash',
      addItem: 'Add Item',
      search: 'Search stash...',
      empty: 'No gear/gems found.',
      subtitle: 'What gear and gems do we already have? AI will prioritize these.'
    },
    actions: {
      generateTitle: 'Craft Build',
      generateDesc: 'Use AI to craft builds from your stash and party profile.',
      pantryTitle: 'Stash',
      pantryDesc: 'Update gear and gems.',
      kitchenTitle: 'Hideout Management',
      kitchenDesc: 'Manage members and settings.',
      haveCode: 'Have an invite code?',
      joinCode: 'Join Hideout',
      deleteDesc: 'This action cannot be undone. Are you sure you want to delete this build?',
      recent: 'Recent Builds',
      failedJoin: 'Failed to join hideout. Please check the code.'
    },
    kitchens: {
      title: 'Manage Hideouts',
      loading: 'Loading Hideouts...',
      yourKitchens: 'Your Hideouts',
      inviteCode: 'Invite Code',
      createTitle: 'Create New Hideout',
      createPlaceholder: 'e.g. Atlas Command',
      create: 'Create'
    },
    recipeDetails: {
      backToRecipes: 'Back to Builds'
    },
    settings: {
      title: 'Settings',
      subtitle: 'Manage your profile and preferences.',
      profile: 'Profile',
      preferences: 'Preferences',
      security: 'Security'
    },
    loading: {
      title: 'Forging a powerful build...',
      step1: 'Scanning stash gear and gems...',
      step2: 'Consulting the AI build strategist...',
      step3: 'Drafting your build path...',
      step4: 'Adjusting preferences...',
      step5: 'Checking avoid lists...',
      step6: 'Applying hard restrictions...',
      step7: 'Balancing setup curve...',
      warning: 'Please do not close your browser. This may take a moment.'
    }
  }
};

jest.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => {
    const lang = 'en';
    const t = (key) => {
        const keys = key.split('.');
        let value = translations['en'];
        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                return key;
            }
        }
        return value || key;
    };
    return { t, lang };
  }
}));
