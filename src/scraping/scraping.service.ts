import {
  DescribeTableCommand,
  DescribeTableCommandInput,
  DescribeTableCommandOutput,
} from '@aws-sdk/client-dynamodb';
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';
import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
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
        recipeUrls.push(course.recipe.websiteUrl as never);
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

  async saveRecipe(
    recipe: Record<string, unknown>,
    recipeId: string,
    recipeNumber: number,
  ): Promise<boolean> {
    const client = this.appService.giveMeTheDynamoDbClient();

    /**
     * The title is in format: speedy-bulgogi-chicken-noodles-65cb875708f1b9082fbcc57f
     * We want to remove the salt at the end
     */
    const recipeIdArray = recipeId.split('-');
    recipeIdArray.pop();
    const newRecipeId = recipeIdArray.join('-');

    const entity: Record<string, unknown> = {
      ...recipe,
      pk: newRecipeId,
      sk: recipe.totalTime,
    };

    /**
     * Add recipe number to GSI3
     */
    entity.GSI3_pk = '#RECIPENUMBERS';
    entity.GSI3_sk = recipeNumber;

    // find out if food is vegetarian or vegan
    if ((recipe.keywords as string[]).includes('Vegan')) {
      entity.diet = 'Vegan';
    } else if ((recipe.keywords as string[]).includes('Veggie')) {
      entity.diet = 'Vegetarian';
    } else {
      entity.diet = 'Meat';
    }
    // add to meat free gsi
    if (entity.diet === 'Vegan' || entity.diet === 'Vegetarian') {
      entity.GSI1_pk = 'Non-Meat';
      entity.GSI1_sk = entity.sk;
    } else {
      entity.GSI1_pk = 'Meat';
      entity.GSI1_sk = entity.sk;
    }

    /**
     * do gsi for meal type. This is based on the recipe name.
     * - salad
     * - curry / masala / tikka / jalfrezzi / laksa / pasanda / biriyani / dahl / dal
     * - stir-fry
     * - tacos
     * - noodles / noodle
     * - bruschetta
     * - steak
     * - burger
     * - pie
     * - rice-bowl
     * - soup
     * - risotto
     * - pasta / linguine / tagliatelle / rigatoni / penne / spaghetti / mac-and-cheese etc... --> put all of those in the same
     * - quesadillas
     * - stew
     * - wraps
     * - gratin
     * - halloumi
     *
     * if the title does not contain any of they key words then make meal type 'Uncategorised'
     */
    const title = entity.pk as string;
    if (title.includes('salad')) {
      entity.GSI2_pk = 'salad';
    } else if (
      // do as many indian dishes as possible
      title.includes('curry') ||
      title.includes('masala') ||
      title.includes('tikka') ||
      title.includes('jalfrezzi') ||
      title.includes('laksa') ||
      title.includes('pasanda') ||
      title.includes('biriyani') ||
      title.includes('dal') ||
      title.includes('dahl') ||
      title.includes('korma')
    ) {
      entity.GSI2_pk = 'curry';
    } else if (title.includes('stir-fry')) {
      entity.GSI2_pk = 'stir-fry';
    } else if (title.includes('tacos')) {
      entity.GSI2_pk = 'tacos';
    } else if (
      title.includes('noodles') ||
      title.includes('noodle') ||
      title.includes('ramen')
    ) {
      entity.GSI2_pk = 'noodles';
    } else if (title.includes('bruschetta')) {
      entity.GSI2_pk = 'bruschetta';
    } else if (title.includes('steak')) {
      entity.GSI2_pk = 'steak';
    } else if (title.includes('burger')) {
      entity.GSI2_pk = 'burger';
    } else if (title.includes('pie')) {
      entity.GSI2_pk = 'pie';
    } else if (title.includes('rice-bowl')) {
      entity.GSI2_pk = 'rice-bowl';
    } else if (title.includes('quesadillas')) {
      entity.GSI2_pk = 'quesadillas';
    } else if (title.includes('stew')) {
      entity.GSI2_pk = 'stew';
    } else if (title.includes('wrap') || title.includes('wraps')) {
      entity.GSI2_pk = 'wraps';
    } else if (title.includes('gratin')) {
      entity.GSI2_pk = 'gratin';
    } else if (title.includes('halloumi')) {
      entity.GSI2_pk = 'halloumi';
    } else if (title.includes('soup')) {
      entity.GSI2_pk = 'soup';
    } else if (title.includes('risotto')) {
      entity.GSI2_pk = 'risotto';
    } else if (
      title.includes('pasta') ||
      title.includes('linguine') ||
      title.includes('rigatoni') ||
      title.includes('tagliatelle') ||
      title.includes('penne') ||
      title.includes('spaghetti') ||
      title.includes('macaroni') ||
      title.includes('mac-and-cheese')
    ) {
      entity.GSI2_pk = 'pasta';
    } else {
      entity.GSI2_pk = 'uncategorised';
    }

    entity.GSI2_sk = entity.sk;

    const putCommandInput: PutCommandInput = {
      Item: entity,
      TableName: 'recipes',
      ConditionExpression: `attribute_not_exists(pk) and attribute_not_exists(sk)`,
    };

    // the scraper script handles the case where the recipe already exists
    try {
      await client.send(new PutCommand(putCommandInput));
      return true;
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'ConditionalCheckFailedException') {
          console.log(`👎 Duplicate recipe ${entity.pk}. Returning false.`);
          return false;
        } else {
          console.error(
            `💣 Could not save recipe: ${err.name}. Skipping this item. Err: ${err}`,
          );
          throw new Error(err.name);
        }
      } else {
        console.error(
          `💣 Could not save recipe: ${JSON.stringify(
            err,
          )}. Skipping this item`,
        );
        throw new Error();
      }
    }
  }

  /**
   * Sends a DescribeCommandInput to find out the number of items in the recipes table
   * @returns The number of items in the recipes table
   */
  async getNumberOfRecipes() {
    const describeTableCommandInput: DescribeTableCommandInput = {
      TableName: 'recipes',
    };

    const dynamoDBClient = this.appService.giveMeTheDynamoDbClient();

    let describeTableCommandOutput: DescribeTableCommandOutput;
    try {
      describeTableCommandOutput = await dynamoDBClient.send(
        new DescribeTableCommand(describeTableCommandInput),
      );
    } catch (error) {
      Logger.error(
        `Could not describe table ${describeTableCommandInput.TableName}`,
      );
      throw new InternalServerErrorException();
    }

    Logger.debug(
      `Successfully described table ${describeTableCommandInput.TableName}.`,
    );

    if (!describeTableCommandOutput.Table) {
      Logger.error(
        `Could not find table ${describeTableCommandInput.TableName}`,
      );
      throw new InternalServerErrorException();
    }

    Logger.debug(
      `Item count is ${describeTableCommandOutput.Table?.ItemCount}`,
    );

    return describeTableCommandOutput.Table.ItemCount;
  }
}
