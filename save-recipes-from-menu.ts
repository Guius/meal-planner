import {
  DynamoDBClient,
  DynamoDBClientConfig,
  GetItemCommand,
  GetItemCommandInput,
  QueryCommand,
  QueryCommandInput,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';

async function main(week: string) {
  let config: DynamoDBClientConfig = null;

  const nonLocalConfig: DynamoDBClientConfig = {
    region: 'eu-west-2',
    apiVersion: '2012-08-10',
  };

  config = nonLocalConfig;

  // create the client
  const client = DynamoDBDocumentClient.from(new DynamoDBClient(config), {
    marshallOptions: {
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    },
  });

  // Get menu
  let numberOfDuplicates: number;

  let menu;
  try {
    console.log(`👀 Getting menu for week ${week}`);
    const res: AxiosResponse = await axios.get(
      `http://localhost:3000/scraping/menu/${week}`,
    );
    menu = res.data;
  } catch (err) {
    console.error(`Could not get menu: ${JSON.stringify(err)}`);
    process.exit(1);
  }

  console.log(`✅ Successfully got menu for week ${week}.`);

  /**
   * Each recipe will have a unique number. This number will be used to pick a random recipe.
   * Hence each recipe we have should have a number between 1 and the total number of recipes.
   *
   * If we have deleted a recipe, then that number is now free to take (and should be used).
   * All the free numbers to take will be stored in an array in the recipes table under #FREENUMBERS
   */

  // Get the free numbers
  const getFreeNumberCommandInput: GetItemCommandInput = {
    Key: {
      pk: { S: '#FREENUMBERS' },
      sk: { S: '#FREENUMBERS' },
    },
    TableName: 'recipes',
  };

  // let the error bubble to the scraping script
  const freeNumbers: string[] = await client
    .send(new GetItemCommand(getFreeNumberCommandInput))
    .then((res) => {
      if (!res.Item) return [];
      return res.Item.freeNumbers.NS;
    });

  let recipeNumber = '0';

  if (freeNumbers.length === 0) {
    Logger.debug('No free numbers available. Fetching the next number to use');

    /**
     * GSI3 of recipes table is
     * - pk: recipeNumber
     * - sk: recipeNumber
     *
     * We can get the recipe number by querying GSI3 and scanning index forward false
     */

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

    const lastRecipeNumber = await client
      .send(new QueryCommand(getRecipeNumberCommandInput))
      .then((res) => {
        if (res.Items.length === 0) {
          return 0;
        } else {
          return parseInt(res.Items[0].GSI3_sk.S);
        }
      });

    recipeNumber = `${lastRecipeNumber + 1}`;
    Logger.debug(`Recipe number is ${recipeNumber}`);
  } else {
    Logger.debug(`Free numbers found: ${freeNumbers}. `);
    recipeNumber = freeNumbers.pop();

    Logger.debug(`Recipe number is ${recipeNumber}`);

    // save the new free numbers
    const putCommandInput: PutCommandInput = {
      Item: {
        pk: '#FREENUMBERS',
        sk: '#FREENUMBERS',
        freeNumbers: freeNumbers,
      },
      TableName: 'recipes',
    };

    Logger.debug(`New free numbers: ${freeNumbers}`);

    await client.send(new PutCommand(putCommandInput));
  }

  for (let i = 0; i < menu.length; i++) {
    console.log(
      `🕣 Getting recipe ${i + 1}: (${menu[i]}). Wating two second first`,
    );
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const currentRecipe = menu[i];

    // scrape the recipe from hello fresh
    let recipeJson: Record<string, unknown>;
    try {
      console.log(`👀 Getting recipe ${currentRecipe}`);
      const res: AxiosResponse = await axios.get(
        `http://localhost:3000/scraping/recipe/${currentRecipe}`,
      );
      recipeJson = res.data;
    } catch (err) {
      console.error(
        `💣 Could not get recipe: ${JSON.stringify(err)}. Skipping this item`,
      );
      continue;
    }

    console.log(`✅ Successfully got recipe ${currentRecipe}`);

    // save it to the database
    try {
      console.log(`📝 Saving recipe ${currentRecipe}`);
      const result = await axios.post(
        `http://localhost:3000/scraping/recipe/${currentRecipe}/${recipeNumber}`,
        recipeJson,
      );
      if (!result.data) {
        numberOfDuplicates++;
        console.warn(
          `👯 Duplicate: ${currentRecipe}. Recipe number stays at ${recipeNumber}`,
        );
      } else {
        recipeNumber = `${parseInt(recipeNumber) + 1}`;
        console.log(
          `👍 Successfully saved recipe ${currentRecipe}. Recipe number is now ${recipeNumber}`,
        );
      }
    } catch (err) {
      console.error(
        `💣 Could not save recipe: ${JSON.stringify(
          err,
        )}. Skipping this item. Recipe number stays at ${recipeNumber}`,
      );
      continue;
    }
  }

  console.log(
    `👏 Successfully saved ${
      menu.length - (numberOfDuplicates ?? 0)
    } recipes. Total recipes: ${menu.length}. Duplicates: ${
      numberOfDuplicates ?? 0
    }`,
  );
}

main('2024-W1');
