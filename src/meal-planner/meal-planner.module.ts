import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppService } from 'src/app.service';
import { MealPlannerService } from './meal-planner.service';
import { MealPlannerController } from './meal-planner.controller';

@Module({
  controllers: [MealPlannerController],
  providers: [MealPlannerService, AppService],
  imports: [HttpModule],
})
export class MealPlannerModule {}
