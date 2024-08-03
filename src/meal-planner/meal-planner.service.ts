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
