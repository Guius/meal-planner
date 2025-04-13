import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Recipe } from './recipe.entity';

@Entity()
export class Ingredient {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  ingredientId = '';

  @Column({ type: 'varchar' })
  name = '';

  @Column({ type: 'varchar' })
  unit = '';

  @Column({ type: 'varchar' })
  amount = '';

  @ManyToOne(() => Recipe, (recipe) => recipe.recipeIngredient, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recipe_id' })
  recipe!: Recipe;
}
