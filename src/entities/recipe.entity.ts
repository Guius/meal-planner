import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InstructionStep } from './instruction-step.entity';
import { Nutrition } from './nutrition.entity';
import { Ingredient } from './ingredient.entity';

export enum Diet {
  NonMeat = 'Non-Meat',
  Meat = 'Meat',
}

@Entity()
export class Recipe {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name = '';

  @Column({ type: 'longtext' })
  description = '';

  @Column({
    type: 'enum',
    enum: Diet,
  })
  diet: Diet = Diet.Meat;

  @Column('simple-array')
  keywords: string[] = [];

  @Column({ type: 'varchar' })
  recipeCategory = '';

  @Column({ type: 'varchar' })
  recipeCuisine = '';

  @Column({ type: 'varchar' })
  recipeYield = -1;

  @Column({ type: 'varchar' })
  totalTime = '';

  @UpdateDateColumn()
  lastUpdated!: string;

  @OneToOne(() => Nutrition, { cascade: true, eager: true })
  @JoinColumn()
  nutrition!: Nutrition;

  @OneToMany(() => Ingredient, (ingredient) => ingredient.recipe, {
    cascade: true,
    eager: true,
  })
  recipeIngredient!: Ingredient[];

  @OneToMany(() => InstructionStep, (step) => step.recipe, {
    cascade: true,
    eager: true,
  })
  recipeInstructions!: InstructionStep[];
}
