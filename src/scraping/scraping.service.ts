import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ScrapingService {
  constructor(private readonly httpService: HttpService) {}
  async scraping(url: string) {
    try {
      const result = await firstValueFrom(
        this.httpService.get(`https://www.hellofresh.co.uk/recipes/${url}`),
      );
      const html = result.data as string;
      const split1 = html.split(
        '<script type="application/ld+json" id="schema-org">',
      )[1];
      const split2 = split1.split('<footer data-test-id="common-footer">')[0];
      const split3 = split2.split('</script></div></div>')[0];
      const json = JSON.parse(split3);
      console.log(json);
      return json;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err);
    }
  }

  async getMenu(url: string) {
    try {
      const result = await firstValueFrom(
        this.httpService.get(`https://www.hellofresh.co.uk/menus/${url}`),
      );
      const html = result.data as string;
      const split1 = html.split(
        '<script id="__NEXT_DATA__" type="application/json">',
      )[1];
      const split2 = split1.split('(function(){if (!document.body)')[0];
      const split3 = split2.split('</script><script>')[0];
      const json = JSON.parse(split3);
      /**
       * props.pageProps.ssrPayload.courses[0].recipe.websiteUrl
       */
      const recipeIds = [];
      json.props.pageProps.ssrPayload.courses.forEach((course) => {
        recipeIds.push(course.recipe.websiteUrl);
      });
      return recipeIds;
    } catch (err) {}
  }
}
