import { Module } from '@nestjs/common';
import { ScrapingService } from './scraping.service';
import { ScrapingController } from './scraping.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  controllers: [ScrapingController],
  providers: [ScrapingService],
  imports: [HttpModule],
})
export class ScrapingModule {}
