import {
  PutCommand,
  PutCommandInput,
  QueryCommandInput,
  GetCommand,
  GetCommandInput,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ddbDocumentClient } from 'lib/ddbClient';
import { AppService } from 'src/app.service';

@Injectable()
export class RecipesService {
  constructor(private appService: AppService) {}

  /**
   * If the recipe is not found then we have a gap in our recipe numbers.
   * We must fill this. Add it to the list of free numbers.
   * @param recipeNumber
   */
  async getRecipeByRecipeNumber(
    recipeNumber: number,
  ): Promise<Record<string, unknown> | null> {
    const dynamoDBDocumentClient = ddbDocumentClient();

    const getRecipeByRecipeNumberCommandInput: QueryCommandInput = {
      TableName: 'recipes',
      IndexName: 'GSI3',
      ExpressionAttributeValues: {
        ':pk': '#RECIPENUMBERS',
        ':sk': recipeNumber,
      },
      KeyConditionExpression: 'GSI3_pk = :pk AND GSI3_sk = :sk',
    };

    const result = await dynamoDBDocumentClient.send(
      new QueryCommand(getRecipeByRecipeNumberCommandInput),
    );

    if (!result.Items || result.Items.length === 0) {
      /**
       * Add this number to the free numbers list in dynamodb
       * If this bombs out, change the error to be more descriptive
       */
      try {
        await this.saveFreeNumber(recipeNumber);
      } catch (err) {
        console.error(
          `Could not find recipe and failed to add recipe number to list of free numbers`,
        );
        throw new InternalServerErrorException('FREENUMBERUPDATEFAILED');
      }
    }

    if (!result.Items) {
      return null;
    } else if (result.Items.length === 0) {
      return null;
    } else {
      return result.Items[0];
    }
  }

  /**
   * 1. Get the array of free numbers (NS in dynamodb)
   * 2. Add a new number to the array
   * 3. Save the new record to dynamodb
   * @param freeNumber
   */
  async saveFreeNumber(freeNumber: number) {
    const dynamodbClient = this.appService.giveMeTheDynamoDbClient();

    // Get the free numbers
    const getFreeNumberCommandInput: GetCommandInput = {
      Key: {
        pk: '#FREENUMBERS',
        sk: '#FREENUMBERS',
      },
      TableName: 'recipes',
      ConsistentRead: true,
    };

    const freeNumbers = await dynamodbClient
      .send(new GetCommand(getFreeNumberCommandInput))
      .then((res) => {
        if (!res.Item) return [];
        if (!res.Item.freeNumbers) {
          console.error(
            `Found free numbers but it did not have free numbers property`,
          );
          throw new InternalServerErrorException();
        }
        return res.Item.freeNumbers;
      });

    freeNumbers.push(`${freeNumber}`);

    // save the new free numbers
    const putCommandInput: PutCommandInput = {
      Item: {
        pk: '#FREENUMBERS',
        sk: '#FREENUMBERS',
        freeNumbers: freeNumbers,
      },
      TableName: 'recipes',
    };

    await dynamodbClient.send(new PutCommand(putCommandInput));
  }
}
