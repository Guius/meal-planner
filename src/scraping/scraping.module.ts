import { Module } from '@nestjs/common';
import { ScrapingService } from './scraping.service';
import { ScrapingController } from './scraping.controller';
import { HttpModule } from '@nestjs/axios';
import { AppService } from 'src/app.service';
import { ServicesModule } from '../services/services.module';
import { MealPlannerService } from '../services/meal-planner.service';
import { RecipesService } from '../services/recipes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recipe } from '../entities/recipe.entity';

@Module({
  controllers: [ScrapingController],
  providers: [ScrapingService, AppService, MealPlannerService, RecipesService],
  imports: [HttpModule, ServicesModule, TypeOrmModule.forFeature([Recipe])],
})
export class ScrapingModule {}
