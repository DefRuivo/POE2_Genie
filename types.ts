
export type MealType = 'appetizer' | 'main' | 'dessert' | 'snack';
export type Difficulty = 'easy' | 'intermediate' | 'advanced' | 'chef';
export type PrepTimePreference = 'quick' | 'plenty';

export interface PantryItem {
  id: string;
  name: string;
  inStock: boolean;
}

export interface HouseholdMember {
  id: string;
  name: string;
  restrictions: string[]; // Mapped from Restriction entities
  likes: string[];        // Mapped from Like entities
  dislikes: string[];     // Mapped from Dislike entities
  isGuest?: boolean;
}

export interface SessionContext {
  who_is_eating: string[];
  pantry_ingredients: string[];
  requested_type: MealType;
  difficulty_preference: Difficulty;
  prep_time_preference: PrepTimePreference;
  observation?: string;
}

export interface GeneratedRecipe {
  analysis_log: string;
  recipe_title: string;
  match_reasoning: string;
  ingredients_from_pantry: string[];
  shopping_list: string[];
  step_by_step: string[];
  safety_badge: boolean;
  meal_type: MealType;
  difficulty: Difficulty;
  prep_time: string;
}

export interface RecipeRecord extends GeneratedRecipe {
  id: string;
  isFavorite: boolean;
  createdAt: number;
}

export type ViewState = 'home' | 'household' | 'pantry' | 'history';
