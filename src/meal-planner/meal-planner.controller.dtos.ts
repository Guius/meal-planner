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
  recipeIngredient: string[];
  recipeInstructions: InstructionStep[];
  recipeYield: number;
  totalTime: string;
}
