import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppService } from 'src/app.service';
import { MealPlannerService } from '../services/meal-planner.service';
import { MealPlannerController } from './meal-planner.controller';
import { RecipesService } from 'src/services/recipes.service';
import { ServicesModule } from '../services/services.module';

@Module({
  controllers: [MealPlannerController],
  providers: [MealPlannerService, AppService, RecipesService],
  imports: [HttpModule, ServicesModule],
})
export class MealPlannerModule {}
