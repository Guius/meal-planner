import { Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export class Nutrition {
  @IsOptional()
  @IsString()
  calories?: string;
  @IsOptional()
  @IsString()
  carbohydrateContent?: string;
  @IsOptional()
  @IsString()
  cholesterolContent?: string;
  @IsOptional()
  @IsString()
  fatContent?: string;
  @IsOptional()
  @IsString()
  fiberContent?: string;
  @IsOptional()
  @IsString()
  proteinContent?: string;
  @IsOptional()
  @IsString()
  saturatedFatContent?: string;
  @IsOptional()
  @IsString()
  servingSize?: string;
  @IsOptional()
  @IsString()
  sodiumContent?: string;
  @IsOptional()
  @IsString()
  sugarContent?: string;

  constructor(
    calories?: string,
    carbohydrateContent?: string,
    cholesterolContent?: string,
    fatContent?: string,
    fiberContent?: string,
    proteinContent?: string,
    saturatedFatContent?: string,
    servingSize?: string,
    sodiumContent?: string,
    sugarContent?: string,
  ) {
    if (calories) this.calories = calories;
    if (carbohydrateContent) this.carbohydrateContent = carbohydrateContent;
    if (cholesterolContent) this.cholesterolContent = cholesterolContent;
    if (fatContent) this.fatContent = fatContent;
    if (fiberContent) this.fiberContent = fiberContent;
    if (proteinContent) this.proteinContent = proteinContent;
    if (saturatedFatContent) this.saturatedFatContent = saturatedFatContent;
    if (servingSize) this.servingSize = servingSize;
    if (sodiumContent) this.sodiumContent = sodiumContent;
    if (sugarContent) this.sugarContent = sugarContent;
  }
}

export enum Diet {
  NonMeat = 'Non-Meat',
  Meat = 'Meat',
}

export class InstructionStep {
  @IsDefined()
  @IsString()
  type: string;
  @IsDefined()
  @IsString()
  text: string;

  constructor(type: string, text: string) {
    this.type = type;
    this.text = text;
  }
}

export class Ingredient {
  @IsDefined()
  @IsString()
  ingredientId: string;
  @IsDefined()
  @IsString()
  name: string;
  @IsDefined()
  @IsString()
  unit: string;
  @IsDefined()
  @IsString()
  amount: string;

  constructor(name: string, unit: string, amount: string) {
    this.ingredientId = `${name.split(' ').join('_')}#${unit}`;
    this.name = name;
    this.unit = unit;
    this.amount = amount;
  }
}

export class Recipe {
  @IsDefined()
  @IsString()
  description: string;
  @IsDefined()
  @IsEnum(Diet)
  diet: Diet;
  @IsDefined()
  @IsArray()
  @IsString({ each: true })
  keywords: string[];
  @IsDefined()
  @IsString()
  name: string;
  @IsDefined()
  @ValidateNested()
  @Type(() => Nutrition)
  nutrition: Nutrition;
  @IsDefined()
  @IsString()
  recipeCategory: string;
  @IsDefined()
  @IsString()
  recipeCuisine: string;
  @IsDefined()
  @ValidateNested({ each: true })
  @Type(() => Ingredient)
  recipeIngredient: Ingredient[];
  @IsDefined()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InstructionStep)
  recipeInstructions: InstructionStep[];
  @IsDefined()
  @IsInt()
  @IsPositive()
  recipeYield: number;
  @IsDefined()
  @IsString()
  totalTime: string;
  @IsDefined()
  @IsInt()
  lastUpdated: number;

  constructor(
    name: string,
    description: string,
    keywords: string[],
    nutrition: Nutrition,
    recipeCategory: string,
    recipeCuisine: string,
    recipeIngredient: Ingredient[],
    recipeInstructions: InstructionStep[],
    recipeYield: number,
    totalTime: string,
    diet: Diet,
    lastUpdated: number,
  ) {
    this.description = description;
    this.keywords = keywords;
    this.nutrition = nutrition;
    this.recipeCategory = recipeCategory;
    this.recipeIngredient = recipeIngredient;
    this.recipeInstructions = recipeInstructions;
    this.recipeYield = recipeYield;
    this.diet = diet;
    this.name = name;
    this.recipeCuisine = recipeCuisine;
    this.totalTime = totalTime;
    this.lastUpdated = lastUpdated;
  }
}
