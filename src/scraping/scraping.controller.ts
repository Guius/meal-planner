import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ScrapingService } from './scraping.service';

@Controller('scraping')
export class ScrapingController {
  constructor(private readonly scrapingService: ScrapingService) {}

  @Get('recipe/:url')
  async scrapeRecipeFromUrl(@Param('url') url: string) {
    return this.scrapingService.scraping(url);
  }

  @Get('menu/:url')
  async scrapeMenuFromUrl(@Param('url') url: string): Promise<string[]> {
    return this.scrapingService.getMenu(url);
  }

  @Post('recipe/:url/:recipeNumber')
  async saveRecipe(
    @Body() body: Record<string, unknown>,
    @Param('url') url: string,
    @Param('recipeNumber') recipeNumber: number,
  ) {
    return await this.scrapingService.saveRecipe(body, url, +recipeNumber);
  }
}
