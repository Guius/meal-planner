export interface Nutrition {
  calories: string | null;
  carbohydrateContent: string | null;
  cholesterolContent: string | null;
  fatContent: string | null;
  fiberContent: string | null;
  proteinContent: string | null;
  saturatedFatContent: string | null;
  servingSize: string | null;
  sodiumContent: string | null;
  sugarContent: string | null;
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

export interface GenerateAndSendHTMLRequest {
  randomRecipes: RandomRecipeDto[];
  ingredientsList: string[];
}
