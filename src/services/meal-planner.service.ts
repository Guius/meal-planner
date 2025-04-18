import { QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AppService } from 'src/app.service';
import { Recipe } from 'src/entities/recipe.entity';
import { RecipesService } from 'src/services/recipes.service';
import {
  Diet,
  RandomRecipeDto,
} from '../meal-planner/meal-planner.controller.dtos';
import * as fs from 'node:fs';

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
  async getRandomRecipes(numberOfRecipes: number): Promise<Recipe[]> {
    const recipesSelected: Recipe[] = [];
    const lastRecipeNumber = await this.getNumberOfRecipes();
    Logger.debug(`Number of recipes in database: ${lastRecipeNumber}`);

    /**
     * We are going to try and get a set of recipes.
     * We might randomly keep getting the same one.
     * Or we might keep getting a random number that isn't associated with a recipe
     *
     * We don't want this running forever (even though it is very unlikely)
     * I will cap the number of attempts to fill up the array
     */

    for (let numberOfAttempts = 0; numberOfAttempts < 50; numberOfAttempts++) {
      Logger.debug(
        `Attempt number ${numberOfAttempts}. ${recipesSelected.length} recipes selected so far`,
      );

      const randomRecipeNumber = this.randomIntFromInterval(
        1,
        lastRecipeNumber,
      );
      Logger.debug(`Random recipe number selected: ${randomRecipeNumber}`);

      let randomRecipe: Recipe;
      try {
        const result = await this.recipesService.getRecipeByRecipeNumber(
          randomRecipeNumber,
        );
        if (!result) {
          Logger.warn(
            `No recipe found with recipe number ${randomRecipeNumber}. Try again`,
          );
          continue;
        }
        Logger.debug(`Found random recipe!`);
        randomRecipe = result;
      } catch (err) {
        Logger.error(`Failed to get random recipe. Err: ${err}. Trying again.`);
        continue;
      }

      // check that we don't already have this recipe in the recipes array
      // FIXME: This used to work when using dynamodb but the structure of the entities has changed now
      /*
      for (let i = 0; i < recipesSelected.length; i++) {
        Logger.debug(
          `Checking if recipe ${randomRecipe.GSI3_sk} already exists in selected recipes. Recipe selected ${i} number: ${recipesSelected[i].GSI3_sk}`,
        );
        if (randomRecipe.GSI3_sk === recipesSelected[i].GSI3_sk) {
          Logger.debug(
            `Random recipe selected has already been selected. Trying again`,
          );
          continue;
        }
      }
        */

      // push the recipe found to the selected recipes array
      recipesSelected.push(randomRecipe);
      Logger.debug(`Filled ${recipesSelected.length} of ${numberOfRecipes}.`);

      // if we have reached the number requested, break out of the loop
      if (recipesSelected.length >= numberOfRecipes) {
        break;
      }
    }

    return recipesSelected;
  }

  async sendSelectedRecipesByEmail(
    recipeSelection: RandomRecipeDto[],
    ingredientsList: string[],
  ) {
    try {
      await this.generateRecipeSelectionHTMLDoc(
        recipeSelection,
        ingredientsList,
      );
    } catch (err) {
      console.error(`Error generating recipe html. Err: ${err}`);
      throw new InternalServerErrorException();
    }

    const transporter = await this.appService.giveMeTheNodemailerTransporter();

    const html = '<h1>⬇️ Download your selected recipes:</h1>';

    try {
      const info = await transporter.sendMail({
        from: '"Guillaume Vitry" <glmvb261@gmail.com>', // sender address
        to: 'glmvb261@gmail.com', // list of receivers
        subject: '🧑‍🍳 Recipe Selection', // Subject line
        text: 'HTML rendering error', // plain text body
        html: html, // html body
        attachments: [
          {
            filename: 'meal-plan.html',
            path: './src/assets/meal-plan.html',
            contentType: 'text/html',
          },
        ],
      });
      console.log('Message sent: %s', info.messageId);
    } catch (err) {
      console.error(`Error sending email. Err: ${err}`);
    }
  }

  randomIntFromInterval(min, max) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  prettifyRecipeName(name: string): string {
    return (
      name.split('-').join(' ').charAt(0).toUpperCase() +
      name.split('-').join(' ').slice(1).toLowerCase()
    );
  }

  prettifyPrepTime(prepTime: string): string {
    return prepTime.split('T')[1].split('M')[0] + ' minutes';
  }

  async generateRecipeSelectionHTMLDoc(
    recipes: RandomRecipeDto[],
    ingredientsList: string[],
  ) {
    const mealPlanBuffer = fs.readFileSync('./src/assets/meal-plan');
    let mealPlan = mealPlanBuffer.toString();

    const paletteItemTemplate = fs
      .readFileSync('./src/assets/palette-item')
      .toString();

    const paletteItems: string[] = [];
    for (let i = 0; i < recipes.length; i++) {
      let current = paletteItemTemplate.replace(
        '{{ TITLE }}',
        this.prettifyRecipeName(recipes[i].name),
      );
      current = current.replace(
        '{{ PREP_TIME }}',
        this.prettifyPrepTime(recipes[i].totalTime),
      );
      current = current.replace(
        '{{ DIET_CLASS }}',
        recipes[i].diet === 'Non-Meat' ? 'veggie' : 'meatie',
      );
      paletteItems.push(current);
    }

    const palette = paletteItems.join(' ');
    mealPlan = mealPlan.replace('{{ PALETTE_ITEMS }}', palette);

    // INGREDIENTS
    const ingredientItemTemplate = fs
      .readFileSync('./src/assets/ingredients-item')
      .toString();

    const ingredients: string[] = [];
    for (let i = 0; i < ingredientsList.length; i++) {
      const current = ingredientItemTemplate.replace(
        '{{ INGREDIENT }}',
        ingredientsList[i],
      );
      ingredients.push(current);
    }
    const ingredientsHTML = ingredients.join(' ');
    mealPlan = mealPlan.replace('{{ INGREDIENTS_LIST }}', ingredientsHTML);

    fs.writeFileSync('./src/assets/meal-plan.html', mealPlan);
  }
}
