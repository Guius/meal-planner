export interface Nutrition {
  calories?: string;
  carbohydrateContent?: string;
  cholesterolContent?: string;
  fatContent?: string;
  fiberContent?: string;
  proteinContent?: string;
  saturatedFatContent?: string;
  servingSize?: string;
  sodiumContent?: string;
  sugarContent?: string;
}

export interface Ingredient {
  ingredientId: string;
  name: string;
  unit: string;
  amount: string;
}

export enum Diet {
  NonMeat = 'Non-Meat',
  Meat = 'Meat',
}

export interface InstructionStep {
  type: string;
  text: string;
}

export interface RandomRecipeDto {
  description: string;
  diet: Diet;
  keywords: string[];
  name: string;
  nutrition: Nutrition;
  recipeCategory: string;
  recipeCuisine: string;
  recipeIngredient: Ingredient[];
  recipeInstructions: InstructionStep[];
  recipeYield: number;
  totalTime: string;
}
