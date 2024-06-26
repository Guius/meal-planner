import {
  GetCommand,
  GetCommandInput,
  PutCommand,
  PutCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { AppService } from 'src/app.service';

@Injectable()
export class ScrapingService {
  constructor(
    private readonly httpService: HttpService,
    private appService: AppService,
  ) {}
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
      const recipeUrls = [];
      json.props.pageProps.ssrPayload.courses.forEach((course) => {
        recipeUrls.push(course.recipe.websiteUrl);
      });

      const recipeIds = recipeUrls.map((url: string) => {
        return url.split('recipes/')[1];
      });
      return recipeIds;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err);
    }
  }

  async saveRecipe(recipe: Record<string, unknown>, recipeId: string) {
    const client = await this.appService.giveMeTheDynamoDbClient();

    const entity: Record<string, unknown> = {
      ...recipe,
      pk: recipeId,
      sk: recipe.totalTime,
    };

    // find out if food is vegetarian or vegan
    if ((recipe.keywords as string[]).includes('Vegan')) {
      entity.diet = 'Vegan';
    } else if ((recipe.keywords as string[]).includes('Veggie')) {
      entity.diet = 'Vegetarian';
    }
    // then make the diet searchable
    entity.GSI1_pk = entity.diet;
    entity.GSI1_sk = entity.sk;

    const putCommandInput: PutCommandInput = {
      Item: entity,
      TableName: 'recipes',
      ConditionExpression: `attribute_not_exists(pk) and attribute_not_exists(sk)`,
    };

    await client.send(new PutCommand(putCommandInput));
  }
}
