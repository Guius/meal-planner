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

  let recipeNumber = '0';
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
    ConsistentRead: true,
  };

  // let the error bubble to the scraping script
  const freeNumbers: string[] = await client
    .send(new GetItemCommand(getFreeNumberCommandInput))
    .then((res) => {
      if (!res.Item) return [];
      return res.Item.freeNumbers.NS;
    });

  let checkForFreeNumber = false;

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
    checkForFreeNumber = true;

    Logger.debug(`Free numbers found: ${freeNumbers}. `);
    recipeNumber = freeNumbers.pop();

    Logger.debug(`Recipe number is ${recipeNumber}`);
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
        console.log(
          `👍 Successfully saved recipe ${currentRecipe}. Going to determine recipe number`,
        );

        /**
         * FIXME:
         * Currently if there was a free number originally but there is none left after that,
         * we are not updating the free numbers array in the database
         */

        /**
         * If checkForFreeNumber
         * See if there is another free number in the database
         * If not, then get the last recipe number and start from there + set checkForFreeNumber to false
         * If yes, then use the free number and remove it from the freeNumbers array
         */
        if (checkForFreeNumber) {
          console.debug(`Checking for a free number.`);
          let freeNumbers: string[];
          try {
            freeNumbers = await client
              .send(new GetItemCommand(getFreeNumberCommandInput))
              .then((res) => {
                if (!res.Item) return [];
                return res.Item.freeNumbers.NS;
              });
          } catch (err) {
            console.error(
              `Could not get free numbers. Using normal order for the moment`,
            );
            freeNumbers = [];
          }

          if (freeNumbers.length > 0) {
            recipeNumber = freeNumbers.pop();
            checkForFreeNumber = true;

            // save the new free numbers
            const putCommandInput: PutCommandInput = {
              Item: {
                pk: '#FREENUMBERS',
                sk: '#FREENUMBERS',
                freeNumbers: freeNumbers,
              },
              TableName: 'recipes',
            };

            /**
             * If this bombs, then let the script bomb out
             * There is no point continuing if we cannot get a new recipe number.
             */
            await client.send(new PutCommand(putCommandInput));
            Logger.debug(`New free numbers: ${freeNumbers}`);

            console.log(`New recipe number is ${recipeNumber}`);

            /**
             * Now we have the new free number coming from the free numbers list
             * Continue on to the next loop and on the next iteration,
             * we will check again if there is a free number
             */
            continue;
          }
        }

        console.log(
          `No free numbers left. Going to get next recipe number to use`,
        );

        checkForFreeNumber = false;
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
        console.log(`New recipe number is ${recipeNumber}`);
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

main('2024-W3');
