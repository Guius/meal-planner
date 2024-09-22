import { QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AppService } from 'src/app.service';
import { RecipesService } from 'src/services/recipes.service';

@Injectable()
export class MealPlannerService {
  constructor(
    private appService: AppService,
    private recipesService: RecipesService,
  ) {}

  /**
   * Sends a DescribeCommandInput to find out the number of items in the recipes table
   * @returns The number of items in the recipes table
   */
  async getNumberOfRecipes() {
    const getRecipeNumberCommandInput: QueryCommandInput = {
      TableName: 'recipes',
      IndexName: 'GSI3',
      ScanIndexForward: false,
      Limit: 1,
      KeyConditionExpression: 'GSI3_pk = :pk',
      ExpressionAttributeValues: {
        ':pk': '#RECIPENUMBERS',
      },
    };

    /**
     * If this bombs, then let the script bomb out
     * There is no point continuing if we cannot get a new recipe number.
     */
    const client = this.appService.giveMeTheDynamoDbClient();
    const lastRecipeNumber = await client
      .send(new QueryCommand(getRecipeNumberCommandInput))
      .then((res) => {
        if (!res.Items || res.Items.length === 0) {
          return 0;
        } else {
          if (!res.Items[0].GSI3_sk) {
            console.log(res.Items[0].GSI3_sk);
            console.error(`Found last recipe number but no GSI3_sk property`);
            process.exit(1);
          }
          return parseInt(res.Items[0].GSI3_sk);
        }
      });

    return lastRecipeNumber;
  }

  /**
   * Gets a specified number of random recipes.
   * 1. Get the number of recipes in the database
   * 2. Choose a random number between 1 and the number of recipes in the database
   * 3. Get the recipe by recipe number
   *  a) If the recipe does not exist, add the number to the free numbers + try again with a different number (with a max number of attempts)
   * 4. Continue like this until you have the specified number of recipes makig sure of:
   *  - having distinct recipe numbers
   *  - having distinct recipe names
   */
  async getRandomRecipes(
    numberOfRecipes: number,
  ): Promise<Record<string, unknown>> {
    const lastRecipeNumber = await this.getNumberOfRecipes();
    Logger.debug(`Number of recipes in database: ${lastRecipeNumber}`);
    const randomRecipeNumber = this.randomIntFromInterval(1, lastRecipeNumber);
    Logger.debug(`Random recipe number selected: ${randomRecipeNumber}`);
    let randomRecipe: Record<string, unknown>;
    try {
      const result = await this.recipesService.getRecipeByRecipeNumber(
        randomRecipeNumber,
      );
      if (!result) {
        Logger.warn(
          `No recipe found with recipe number ${randomRecipeNumber}. Try again`,
        );
        throw new NotFoundException();
      }
      Logger.debug(`Found random recipe!`);
      randomRecipe = result;
    } catch (err) {
      Logger.error(`Failed to get random recipe. Err: ${err}`);
      throw new InternalServerErrorException();
    }
    return randomRecipe;
  }

  randomIntFromInterval(min, max) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}
