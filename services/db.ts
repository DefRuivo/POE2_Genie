
import { Dexie, type EntityTable } from 'dexie';
import { HouseholdMember, RecipeRecord } from '../types';

interface PantryItem {
  id?: number;
  name: string;
}

interface TagSuggestion {
  id?: number;
  category: 'restrictions' | 'likes' | 'dislikes';
  tag: string;
}

// Definição do Banco de Dados (Estrutura pronta para ser migrada para SQL futuramente)
// Fix: Ensured Dexie is correctly imported and utilized to fix the 'version' property recognition issue.
class DinnerDatabase extends Dexie {
  household!: EntityTable<HouseholdMember, 'id'>;
  pantry!: EntityTable<PantryItem, 'id'>;
  recipes!: EntityTable<RecipeRecord, 'id'>;
  suggestions!: EntityTable<TagSuggestion, 'id'>;

  constructor() {
    super('DinnerDB');
    this.version(1).stores({
      household: 'id, name, isGuest',
      pantry: '++id, &name',
      recipes: 'id, recipe_title, createdAt, isFavorite',
      suggestions: '++id, [category+tag], tag'
    });
  }
}

export const db = new DinnerDatabase();
