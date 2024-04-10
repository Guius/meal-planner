import { Controller, Get, Param } from '@nestjs/common';
import { ScrapingService } from './scraping.service';

@Controller('scraping')
export class ScrapingController {
  constructor(private readonly scrapingService: ScrapingService) {}

  @Get(':url')
  async scrapeRecipeFromUrl(@Param('url') url: string) {
    return this.scrapingService.scraping(url);
  }

  @Get('menu/:url')
  async scrapeMenuFromUrl(@Param('url') url: string) {
    return this.scrapingService.getMenu(url);
  }
}
