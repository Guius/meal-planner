import { Controller, Get, Param } from '@nestjs/common';
import { MealPlannerService } from './meal-planner.service';

@Controller('meal-planner')
export class MealPlannerController {
  constructor(private service: MealPlannerService) {}

  @Get('number-of-items')
  async getNumberOfItems() {
    return await this.service.getNumberOfRecipes();
  }

  @Get('random-recipes/:number-of-recipes')
  async getRandomRecipes(@Param('number-of-recipes') numberOfRecipes: string) {}
}
