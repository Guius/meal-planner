import { Module } from '@nestjs/common';
import { RecipesController } from './recipes.controller';
import { RecipesService } from '../services/recipes.service';
import { AppService } from '../app.service';

@Module({
  controllers: [RecipesController],
  providers: [RecipesService, AppService],
})
export class RecipesModule {}
