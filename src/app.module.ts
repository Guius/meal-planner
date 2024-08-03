import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScrapingModule } from './scraping/scraping.module';
import { MealPlannerModule } from './meal-planner/meal-planner.module';

@Module({
  imports: [ScrapingModule, MealPlannerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
