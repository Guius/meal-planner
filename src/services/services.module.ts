import { Module } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { AppService } from 'src/app.service';

@Module({
  providers: [RecipesService, AppService],
  exports: [RecipesService],
})
export class ServicesModule {}
