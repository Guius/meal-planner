import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Recipe } from './recipe.entity';

@Entity()
export class InstructionStep {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  step = '';

  @Column({ type: 'varchar' })
  text = '';

  @ManyToOne(() => Recipe, (recipe) => recipe.recipeInstructions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recipe_id' })
  recipe!: Recipe;
}
