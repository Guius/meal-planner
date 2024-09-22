import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Param,
} from '@nestjs/common';
import { MealPlannerService } from './meal-planner.service';

@Controller('meal-planner')
export class MealPlannerController {
  constructor(private service: MealPlannerService) {}

  @Get('number-of-items')
  async getNumberOfItems() {
    return await this.service.getNumberOfRecipes();
  }

  @Get('random-recipes/:numberOfRecipes')
  async getRandomRecipes(@Param('numberOfRecipes') numberOfRecipes: number) {
    if (numberOfRecipes > 20) {
      Logger.error(`Client requested more than 20 recipes. Not allowing this`);
      throw new BadRequestException();
    }
    return await this.service.getRandomRecipes(numberOfRecipes);
  }
}
