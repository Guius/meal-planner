import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScrapingModule } from './scraping/scraping.module';
import { MealPlannerModule } from './meal-planner/meal-planner.module';
import { TestController } from './testing/testing.controller';
import { ServicesModule } from './services/services.module';
import { RecipesService } from './services/recipes.service';
import { RecipesModule } from './recipes/recipes.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recipe } from './entities/recipe.entity';
import { InstructionStep } from './entities/instruction-step.entity';
import { Nutrition } from './entities/nutrition.entity';
import { Ingredient } from './entities/ingredient.entity';

@Module({
  imports: [
    ScrapingModule,
    MealPlannerModule,
    ServicesModule,
    RecipesModule,
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        if (!process.env.DATABASE_PORT) {
          throw Error('DATABASE_PORT MISSING');
        }
        return {
          entities: [Recipe, InstructionStep, Nutrition, Ingredient],
          type: 'mysql',
          host: process.env.DATABASE_HOST,
          port: process.env.DATABASE_PORT ? +process.env.DATABASE_PORT : 3306,
          username: process.env.DATABASE_USER,
          password: process.env.DATABASE_PASSWORD,
          database: process.env.DATABASE_NAME,
          autoLoadEntities: true,
          // DO NOT TURN ON SYNCHRONIZE
          synchronize: false,
          bigNumberStrings: false,
        };
      },
      imports: undefined,
    }),
  ],
  controllers: [AppController, TestController],
  providers: [AppService, RecipesService],
})
export class AppModule {}
