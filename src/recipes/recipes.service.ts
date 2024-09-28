import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Recipe } from '../entities/recipe.entity';
import { AppService } from '../app.service';
import { validate } from 'class-validator';
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';

@Injectable()
export class RecipesService {
  constructor(private appService: AppService) {}

  /**
   * FIXME: use the dtos from './recipes.service.dtos.ts'
   * Currently using the entity because this is being used to transform the data
   * @param recipe
   */
  async updateRecipe(recipe: Recipe): Promise<void> {
    const client = this.appService.giveMeTheDynamoDbClient();

    // validate the recipe entity
    validate(recipe, {
      whitelist: true,
      forbidNonWhitelisted: true,
    }).then((errors) => {
      // errors is an array of validation errors
      if (errors.length > 0) {
        Logger.error('Recipe failed validation. errors: ', errors);
        throw new BadRequestException();
      } else {
        Logger.debug('Validation of recipe succeeded');
      }
    });

    const putCommandInput: PutCommandInput = {
      TableName: 'recipes',
      Item: recipe,
      ConditionExpression: 'attribute_exists(pk)',
    };

    await client.send(new PutCommand(putCommandInput));
  }
}
