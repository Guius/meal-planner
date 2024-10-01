import { Module } from '@nestjs/common';
import { ScrapingService } from './scraping.service';
import { ScrapingController } from './scraping.controller';
import { HttpModule } from '@nestjs/axios';
import { AppService } from 'src/app.service';
import { ServicesModule } from '../services/services.module';
import { MealPlannerService } from '../services/meal-planner.service';
import { RecipesService } from '../services/recipes.service';

@Module({
  controllers: [ScrapingController],
  providers: [ScrapingService, AppService, MealPlannerService, RecipesService],
  imports: [HttpModule, ServicesModule],
})
export class ScrapingModule {}
