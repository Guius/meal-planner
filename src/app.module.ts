import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScrapingModule } from './scraping/scraping.module';
import { MealPlannerModule } from './meal-planner/meal-planner.module';
import { TestController } from './testing/testing.controller';
import { ServicesModule } from './services/services.module';
import { RecipesService } from './services/recipes.service';
import { RecipesModule } from './recipes/recipes.module';

@Module({
  imports: [ScrapingModule, MealPlannerModule, ServicesModule, RecipesModule],
  controllers: [AppController, TestController],
  providers: [AppService, RecipesService],
})
export class AppModule {}
