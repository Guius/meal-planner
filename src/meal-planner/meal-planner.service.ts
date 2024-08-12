import {
  DescribeTableCommand,
  DescribeTableCommandInput,
  DescribeTableCommandOutput,
} from '@aws-sdk/client-dynamodb';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AppService } from 'src/app.service';

@Injectable()
export class MealPlannerService {
  constructor(private appService: AppService) {}

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
  // async getRandomRecipes(
  //   numberOfRecipes: number,
  // ): Promise<Record<string, unknown>> {}
}
