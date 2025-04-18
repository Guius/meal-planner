import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
} from '@nestjs/common';
import { MealPlannerService } from '../services/meal-planner.service';
import {
  GenerateAndSendHTMLRequest,
  InstructionStep,
  RandomRecipeDto,
} from './meal-planner.controller.dtos';

@Controller('meal-planner')
export class MealPlannerController {
  constructor(private service: MealPlannerService) {}

  @Get('number-of-items')
  async getNumberOfItems() {
    return await this.service.getNumberOfRecipes();
  }

  @Get('random-recipes/:numberOfRecipes')
  async getRandomRecipes(
    @Param('numberOfRecipes') numberOfRecipes: number,
  ): Promise<RandomRecipeDto[]> {
    if (numberOfRecipes > 20) {
      Logger.error(`Client requested more than 20 recipes. Not allowing this`);
      throw new BadRequestException();
    }
    let result: RandomRecipeDto[] = [];
    const entities = await this.service.getRandomRecipes(numberOfRecipes);

    result = entities.map((val) => {
      return {
        name: val.name,
        description: val.description,
        recipeCuisine: val.recipeCuisine,
        totalTime: val.totalTime,
        recipeCategory: val.recipeCategory,
        recipeIngredient: val.recipeIngredient,
        keywords: val.keywords,
        diet: val.diet,
        nutrition: val.nutrition,
        recipeInstructions: val.recipeInstructions.map(
          (val): InstructionStep => {
            return {
              text: val.text,
              type: val.step,
            };
          },
        ),
        recipeYield: val.recipeYield,
      };
    });
    return result;
  }

  @Post('send-recipes-in-email')
  async sendRecipesInEmail(@Body() body: GenerateAndSendHTMLRequest) {
    console.log(body.randomRecipes);
    await this.service.sendSelectedRecipesByEmail(
      body.randomRecipes,
      body.ingredientsList,
    );
  }

  @Post('write-recipes-to-pdf')
  async writeRecipesToPdf(@Body() body: GenerateAndSendHTMLRequest) {
    await this.service.generateRecipeSelectionHTMLDoc(
      body.randomRecipes,
      body.ingredientsList,
    );
  }
}
