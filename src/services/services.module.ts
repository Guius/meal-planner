import { Module } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { AppService } from 'src/app.service';
import { MealPlannerService } from './meal-planner.service';

@Module({
  providers: [RecipesService, AppService, MealPlannerService],
  exports: [RecipesService, MealPlannerService],
})
export class ServicesModule {}
