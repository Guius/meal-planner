import {
  DescribeTableCommand,
  DescribeTableCommandInput,
  DescribeTableCommandOutput,
} from '@aws-sdk/client-dynamodb';
import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { firstValueFrom } from 'rxjs';
import { AppService } from 'src/app.service';
import {
  Diet,
  Ingredient,
  InstructionStep,
  Nutrition,
  Recipe,
} from '../lib/recipe-validation.dtos';
import { Recipe as RecipeEntity } from '../entities/recipe.entity';
import { Ingredient as IngredientEntity } from '../entities/ingredient.entity';
import { Nutrition as NutritionEntity } from '../entities/nutrition.entity';
import { InstructionStep as InstructionStepEntity } from '../entities/instruction-step.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class ScrapingService {
  constructor(
    private readonly httpService: HttpService,
    private appService: AppService,
    private dataSource: DataSource,
  ) {}
  async scraping(url: string) {
    try {
      const result = await firstValueFrom(
        this.httpService.get(`https://www.hellofresh.co.uk/recipes/${url}`),
      );
      const html = result.data as string;
      const split1 = html.split(
        '<script type="application/ld+json" id="schema-org">',
      )[1];
      const split2 = split1.split('<footer data-test-id="common-footer">')[0];
      const split3 = split2.split('</script></div></div>')[0];
      const json = JSON.parse(split3);
      return json;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err);
    }
  }

  async getMenu(url: string) {
    try {
      const result = await firstValueFrom(
        this.httpService.get(`https://www.hellofresh.co.uk/menus/${url}`),
      );
      const html = result.data as string;
      const split1 = html.split(
        '<script id="__NEXT_DATA__" type="application/json">',
      )[1];
      const split2 = split1.split('(function(){if (!document.body)')[0];
      const split3 = split2.split('</script><script>')[0];
      const json = JSON.parse(split3);
      /**
       * props.pageProps.ssrPayload.courses[0].recipe.websiteUrl
       */
      const recipeUrls = [];
      json.props.pageProps.ssrPayload.courses.forEach((course) => {
        recipeUrls.push(course.recipe.websiteUrl as never);
      });

      const recipeIds = recipeUrls.map((url: string) => {
        return url.split('recipes/')[1];
      });
      return recipeIds;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err);
    }
  }

  async saveRecipe(
    recipe: Record<string, unknown>,
    recipeId: string,
  ): Promise<boolean> {
    /**
     * The title is in format: speedy-bulgogi-chicken-noodles-65cb875708f1b9082fbcc57f
     * We want to remove the salt at the end
     */
    const recipeIdArray = recipeId.split('-');
    recipeIdArray.pop();
    const newRecipeId = recipeIdArray.join('-');

    // find out if food is vegetarian or vegan
    let diet: Diet;
    let intermediateDiet: string;
    if ((recipe.keywords as string[]).includes('Vegan')) {
      intermediateDiet = 'Vegan';
    } else if ((recipe.keywords as string[]).includes('Veggie')) {
      intermediateDiet = 'Vegetarian';
    } else {
      intermediateDiet = 'Meat';
    }
    // add to meat free gsi
    if (intermediateDiet === 'Vegan' || intermediateDiet === 'Vegetarian') {
      diet = Diet.NonMeat;
    } else {
      diet = Diet.Meat;
    }

    const n = new Nutrition(
      (recipe.nutrition as Record<string, string>).calories,
      (recipe.nutrition as Record<string, string>).carbohydrateContent,
      (recipe.nutrition as Record<string, string>).cholesterolContent,
      (recipe.nutrition as Record<string, string>).fatContent,
      (recipe.nutrition as Record<string, string>).fiberContent,
      (recipe.nutrition as Record<string, string>).proteinContent,
      (recipe.nutrition as Record<string, string>).saturatedFatContent,
      (recipe.nutrition as Record<string, string>).servingSize,
      (recipe.nutrition as Record<string, string>).sodiumContent,
      (recipe.nutrition as Record<string, string>).sugarContent,
    );

    const instructions: InstructionStep[] = [];

    for (
      let i = 0;
      i < (recipe.recipeInstructions as Record<string, string>[]).length;
      i++
    ) {
      const instructionStep = new InstructionStep(
        (recipe.recipeInstructions as Record<string, string>[])[i]['@type'],
        (recipe.recipeInstructions as Record<string, string>[])[i].text,
      );

      instructions.push(instructionStep);
    }

    const ingredients: Ingredient[] = [];

    for (let i = 0; i < (recipe.recipeIngredient as string[]).length; i++) {
      const ingredientString = (recipe.recipeIngredient as string[])[i];
      const ingredient = this.fromStringToIngredientDto(ingredientString);
      console.log(ingredient);

      ingredients.push(
        new Ingredient(ingredient.name, ingredient.unit, ingredient.amount),
      );
    }

    /**
     * Recipe cuisine can be 0 (presumably if there is no recipe cuisine).
     * In that case, let's save it as a string of "0" so that we can search for all recipes
     * without any cuisine
     */
    if (recipe.recipeCuisine === 0) recipe.recipeCuisine = '0';

    const r = new Recipe(
      newRecipeId,
      recipe.description as string,
      recipe.keywords as string[],
      n,
      recipe.recipeCategory as string,
      recipe.recipeCuisine as string,
      ingredients,
      instructions,
      recipe.recipeYield as number,
      recipe.totalTime as string,
      diet,
      Date.now(),
    );

    // validate the recipe entity
    validate(r, {
      whitelist: true,
      forbidNonWhitelisted: true,
    }).then((errors) => {
      // errors is an array of validation errors
      if (errors.length > 0) {
        Logger.error(
          `Recipe failed validation. Recipe: ${JSON.stringify(r)} errors: `,
          errors,
        );
        throw new InternalServerErrorException();
      } else {
        Logger.debug('Validation of recipe succeeded');
      }
    });

    /**
     * Let the error bubble to the scraper script
     */
    return await this.createRecipeIfNotExists(r, n, ingredients, instructions);
  }

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

  fromStringToIngredientDto(ingredientString: string): Ingredient {
    const name = ingredientString.split(' ').slice(2).join(' ');
    const unit = ingredientString.split(' ').slice(1, 2).join(' ');
    const ingredientId = `${ingredientString
      .split(' ')
      .slice(2)
      .join('_')}#${unit}`;
    let amount = ingredientString.split(' ').slice(0, 1).join(' ');
    const amountSplit = amount.split('');

    if (amountSplit.includes('½')) {
      Logger.log(`amount included half. Ingredient: ${ingredientString}`);
      amount = `${this.addFractionToAmount(amountSplit, 0.5)}`;
    } else if (amountSplit.includes('¼')) {
      Logger.log(`amount included quarter. Ingredient: ${ingredientString}`);
      amount = `${this.addFractionToAmount(amountSplit, 0.25)}`;
    } else if (amountSplit.includes('¾')) {
      Logger.log(
        `amount included three quarters. Ingredient: ${ingredientString}`,
      );
      amount = `${this.addFractionToAmount(amountSplit, 0.75)}`;
    } else if (amountSplit.includes('⅓')) {
      Logger.log(`amount included one third. Ingredient: ${ingredientString}`);
      amount = `${this.addFractionToAmount(amountSplit, 0.333)}`;
    } else if (amountSplit.includes('⅔')) {
      Logger.log(`amount included two thirds. Ingredient: ${ingredientString}`);
      amount = `${this.addFractionToAmount(amountSplit, 0.666)}`;
    }

    return {
      amount: amount,
      ingredientId: ingredientId,
      name: name,
      unit: unit,
    };
  }

  addFractionToAmount(amountSplit: string[], numericFraction: number): number {
    // 62½ -> ['6', '2', '½']
    Logger.log(`amountSplit: ${amountSplit}`);
    if (amountSplit.length === 1) {
      return numericFraction;
    }
    amountSplit.pop();
    // -> ['6', '2']
    Logger.log(`amountSplit after pop: ${amountSplit}`);
    const integerPart = parseInt(amountSplit.join(''));
    // 62
    if (isNaN(integerPart)) {
      console.log('ingredient amount not formed as expected');
      throw new Error();
    }
    // 62 + 0.5
    return integerPart + numericFraction;
  }

  /**
   * Returns
   * - true if recipe save successful
   * - false if there is a duplicatge
   * - error if anything has gone wrong when saving recipe
   *
   */
  async createRecipeIfNotExists(
    r: Recipe,
    n: Nutrition,
    ingredients: Ingredient[],
    instructions: InstructionStep[],
  ): Promise<boolean> {
    const result = await this.dataSource.transaction(async (manager) => {
      // Check if recipe already exists
      const existingRecipe = await manager.getRepository(RecipeEntity).findOne({
        where: { name: r.name, totalTime: r.totalTime },
      });

      if (existingRecipe) {
        // Optionally return or log that the recipe already exists
        console.log(
          `👯‍♀️ Recipe with name ${existingRecipe.name} and total time ${existingRecipe.totalTime} already exists. Not saving.`,
        );
        return false;
      }

      const nutritionEntity = manager.getRepository(NutritionEntity).create({
        calories: n.calories,
        carbohydrateContent: n.carbohydrateContent,
        cholesterolContent: n.cholesterolContent,
        fatContent: n.fatContent,
        fiberContent: n.fiberContent,
        proteinContent: n.proteinContent,
        saturatedFatContent: n.saturatedFatContent,
        servingSize: n.servingSize,
        sodiumContent: n.sodiumContent,
        sugarContent: n.sugarContent,
      });

      await manager.getRepository(NutritionEntity).save(nutritionEntity);

      const entity = manager.getRepository(RecipeEntity).create({
        name: r.name,
        description: r.description,
        diet: r.diet,
        keywords: r.keywords,
        nutrition: nutritionEntity,
        recipeCategory: r.recipeCategory,
        recipeCuisine: r.recipeCuisine,
        recipeYield: r.recipeYield,
        totalTime: r.totalTime,
      });

      await manager.getRepository(RecipeEntity).save(entity);

      const ingredientEntities: IngredientEntity[] = ingredients.map(
        (val: Ingredient) => {
          return manager.getRepository(IngredientEntity).create({
            ingredientId: val.ingredientId,
            amount: val.amount,
            name: val.name,
            recipe: entity,
            unit: val.unit,
          });
        },
      );

      const recipeInstructionStepEntities = instructions.map((val) => {
        return manager.getRepository(InstructionStepEntity).create({
          recipe: entity,
          text: val.text,
          step: val.type,
        });
      });

      entity.recipeIngredient = ingredientEntities;
      entity.recipeInstructions = recipeInstructionStepEntities;

      await manager.getRepository(IngredientEntity).save(ingredientEntities);
      await manager
        .getRepository(InstructionStepEntity)
        .save(recipeInstructionStepEntities);

      return true;
    });

    return result;
  }
}
