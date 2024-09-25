import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandInput,
  GetCommand,
  GetCommandInput,
  QueryCommand,
  QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';

async function main(week: string) {
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

  // Get menu
  let numberOfDuplicates = 0;

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

  let recipeNumber = 0;
  /**
   * Each recipe will have a unique number. This number will be used to pick a random recipe.
   * Hence each recipe we have should have a number between 1 and the total number of recipes.
   *
   * If we have deleted a recipe, then that number is now free to take (and should be used).
   * All the free numbers to take will be stored in an array in the recipes table under #FREENUMBERS
   */

  let checkForFreeNumber = true;
  let checkForNewNumber = false;
  let stayAtCurrentRecipeNumber = false;

  for (let i = 0; i < menu.length; i++) {
    /**
     * If checkForFreeNumber
     * See if there is another free number in the database
     * If not, then get the last recipe number and start from there + set checkForFreeNumber to false
     * If yes, then use the free number and remove it from the freeNumbers array
     */
    if (checkForFreeNumber) {
      console.debug(`Checking for a free number.`);
      let freeNumbers: string[];
      // Get the free numbers
      const getFreeNumberCommandInput: GetCommandInput = {
        Key: {
          pk: '#FREENUMBERS',
          sk: '#FREENUMBERS',
        },
        TableName: 'recipes',
        ConsistentRead: true,
      };

      try {
        freeNumbers = await client
          .send(new GetCommand(getFreeNumberCommandInput))
          .then((res) => {
            if (!res.Item) return [];
            return res.Item.freeNumbers ?? [];
          });
      } catch (err) {
        console.error(
          `Could not get free numbers. Using normal order for the moment`,
        );
        freeNumbers = [];
      }

      if (freeNumbers.length > 0) {
        const lastItem = freeNumbers.pop();
        if (lastItem) {
          recipeNumber = parseInt(lastItem);

          checkForFreeNumber = true;
          checkForNewNumber = false;

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
        }
      } else {
        console.log(
          `No free numbers in the database. Starting loop again to check for new recipe number `,
        );
        checkForFreeNumber = false;
        checkForNewNumber = true;
        continue;
      }
    } else if (checkForNewNumber) {
      console.log(
        `No free numbers left. Going to get next recipe number to use`,
      );

      checkForFreeNumber = false;
      checkForNewNumber = false;

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
      const lastRecipeNumber = await client
        .send(new QueryCommand(getRecipeNumberCommandInput))
        .then((res) => {
          if (!res.Items || res.Items.length === 0) {
            return 0;
          } else {
            if (!res.Items[0].GSI3_sk) {
              console.log(res.Items[0].GSI3_sk);
              console.error(
                `Found last recipe number but no property GSI3_sk found`,
              );
              process.exit(1);
            }
            return parseInt(res.Items[0].GSI3_sk);
          }
        });

      recipeNumber = lastRecipeNumber + 1;
      console.log(`New recipe number is ${recipeNumber}`);
    } else if (stayAtCurrentRecipeNumber) {
      console.log(`Stayed at current recipe number ${recipeNumber}`);
    } else {
      console.log(
        'No free numbers left and we have already checked last recipe number. Now incrementing with each loop',
      );

      checkForFreeNumber = false;
      checkForNewNumber = false;

      recipeNumber = recipeNumber + 1;
      console.log(`New recipe number is ${recipeNumber}`);
    }

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
        stayAtCurrentRecipeNumber = true;
        console.warn(
          `👯 Duplicate: ${currentRecipe}. Recipe number stays at ${recipeNumber}`,
        );
      } else {
        console.log(
          `👍 Successfully saved recipe ${currentRecipe}. Going to determine recipe number`,
        );
        stayAtCurrentRecipeNumber = false;
      }
    } catch (err) {
      console.error(
        `💣 Could not save recipe: ${JSON.stringify(
          err,
        )}. Skipping this item. Recipe number stays at ${recipeNumber}`,
      );
      stayAtCurrentRecipeNumber = true;
      continue;
    }
  }

  /**
   * TODO:
   * If we finished the loop with stayAtCurrentRecipeNumber = true with a free recipe number,
   * then we are in a situation where we have removed that free number from the database
   * but have not used it.
   *
   * Worse comes to worse, if this happens then we will have a gap in the recipe numbers
   * In that case when we try and get a recipe and it doesn't exist, we can add that number to the free numbers again
   *
   * FIXME:
   */

  console.log(
    `👏 Successfully saved ${
      menu.length - (numberOfDuplicates ?? 0)
    } recipes. Total recipes: ${menu.length}. Duplicates: ${
      numberOfDuplicates ?? 0
    }`,
  );
}

main('2024-W3');
