import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Ingredient } from './src/entities/recipe.entity';

async function main() {
  const config = {
    region: 'eu-west-2',
    apiVersion: '2012-08-10',
  };

  // create the client
  const client = DynamoDBDocumentClient.from(new DynamoDBClient(config), {
    marshallOptions: {
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    },
  });
}

function changeStringToIngredientObj(ingredientString: string): Ingredient {}
