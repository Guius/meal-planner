import { Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsEnum,
  IsInt,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export class Nutrition {
  @IsDefined()
  @IsString()
  calories: string;
  @IsDefined()
  @IsString()
  carbohydrateContent: string;
  @IsDefined()
  @IsString()
  cholesterolContent: string;
  @IsDefined()
  @IsString()
  fatContent: string;
  @IsDefined()
  @IsString()
  fiberContent: string;
  @IsDefined()
  @IsString()
  proteinContent: string;
  @IsDefined()
  @IsString()
  saturatedFatContent: string;
  @IsDefined()
  @IsString()
  servingSize: string;
  @IsDefined()
  @IsString()
  sodiumContent: string;
  @IsDefined()
  @IsString()
  sugarContent: string;

  constructor(
    calories: string,
    carbohydrateContent: string,
    cholesterolContent: string,
    fatContent: string,
    fiberContent: string,
    proteinContent: string,
    saturatedFatContent: string,
    servingSize: string,
    sodiumContent: string,
    sugarContent: string,
  ) {
    this.calories = calories;
    this.carbohydrateContent = carbohydrateContent;
    this.cholesterolContent = cholesterolContent;
    this.fatContent = fatContent;
    this.fiberContent = fiberContent;
    this.proteinContent = proteinContent;
    this.saturatedFatContent = saturatedFatContent;
    this.servingSize = servingSize;
    this.sodiumContent = sodiumContent;
    this.sugarContent = sugarContent;
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

export class Recipe {
  @IsDefined()
  @IsString()
  pk: string;
  @IsDefined()
  @IsString()
  sk: string;
  @IsDefined()
  @IsString()
  description: string;
  @IsDefined()
  @IsEnum(Diet)
  diet: Diet;
  @IsDefined()
  @IsString()
  GSI1_pk: string;
  @IsDefined()
  @IsString()
  GSI1_sk: string;
  @IsDefined()
  @IsString()
  GSI2_pk: string;
  @IsDefined()
  @IsString()
  GSI2_sk: string;
  @IsDefined()
  @IsString()
  GSI3_pk: string;
  @IsDefined()
  @IsInt()
  @IsPositive()
  GSI3_sk: number;
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
  @IsArray()
  @IsString({ each: true })
  recipeIngredient: string[];
  @IsDefined()
  @IsArray()
  @IsEnum(InstructionStep, { each: true })
  recipeInstructions: InstructionStep[];
  @IsDefined()
  @IsInt()
  @IsPositive()
  recipeYield: number;
  @IsDefined()
  @IsString()
  totalTime: string;

  constructor(
    name: string,
    description: string,
    keywords: string[],
    nutrition: Nutrition,
    recipeCategory: string,
    recipeCuisine: string,
    recipeIngredient: string[],
    recipeInstructions: InstructionStep[],
    recipeYield: number,
    totalTime: string,
    recipeNumber: number,
    diet: Diet,
  ) {
    this.pk = name;
    this.sk = totalTime;
    this.GSI1_pk = diet;
    this.GSI1_sk = totalTime;
    this.GSI2_pk = recipeCuisine;
    this.GSI2_sk = totalTime;
    this.GSI3_pk = '#RECIPENUMBERS';
    this.GSI3_sk = recipeNumber;

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
  }
}
