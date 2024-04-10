import { Module } from '@nestjs/common';
import { ScrapingService } from './scraping.service';
import { ScrapingController } from './scraping.controller';
import { HttpModule } from '@nestjs/axios';
import { AppService } from 'src/app.service';

@Module({
  controllers: [ScrapingController],
  providers: [ScrapingService, AppService],
  imports: [HttpModule],
})
export class ScrapingModule {}
