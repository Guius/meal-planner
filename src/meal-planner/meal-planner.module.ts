import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppService } from 'src/app.service';
import { MealPlannerService } from './meal-planner.service';
import { MealPlannerController } from './meal-planner.controller';
import { RecipesService } from 'src/services/recipes.service';

@Module({
  controllers: [MealPlannerController],
  providers: [MealPlannerService, AppService, RecipesService],
  imports: [HttpModule],
})
export class MealPlannerModule {}
