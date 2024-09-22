import { QueryCommand, QueryCommandInput } from '@aws-sdk/client-dynamodb';
import { Controller, Get } from '@nestjs/common';
import { AppService } from 'src/app.service';

@Controller('testing')
export class TestController {
  constructor(private appService: AppService) {}

  @Get('get-recipe-number')
  async getRecipeNumber() {
    const getRecipeNumberCommandInput: QueryCommandInput = {
      TableName: 'recipes',
      IndexName: 'GSI3',
      ScanIndexForward: false,
      Limit: 1,
      KeyConditionExpression: 'GSI3_pk = :pk',
      ExpressionAttributeValues: {
        ':pk': { S: '#RECIPENUMBERS' },
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
          if (!res.Items[0].GSI3_sk.N) {
            console.log(res.Items[0].GSI3_sk);
            console.error(
              `Found last recipe number but property GSI3_sk does not have S attribute`,
            );
            process.exit(1);
          }
          return parseInt(res.Items[0].GSI3_sk.N);
        }
      });

    return lastRecipeNumber;
  }
}
