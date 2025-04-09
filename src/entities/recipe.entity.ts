import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';

export enum Diet {
  NonMeat = 'Non-Meat',
  Meat = 'Meat',
}

@Entity()
export class Nutrition {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true, type: 'varchar' })
  calories: string | null = null;

  @Column({ nullable: true, type: 'varchar' })
  carbohydrateContent: string | null = null;

  @Column({ nullable: true, type: 'varchar' })
  cholesterolContent: string | null = null;

  @Column({ nullable: true, type: 'varchar' })
  fatContent: string | null = null;

  @Column({ nullable: true, type: 'varchar' })
  fiberContent: string | null = null;

  @Column({ nullable: true, type: 'varchar' })
  proteinContent: string | null = null;

  @Column({ nullable: true, type: 'varchar' })
  saturatedFatContent: string | null = null;

  @Column({ nullable: true, type: 'varchar' })
  servingSize: string | null = null;

  @Column({ nullable: true, type: 'varchar' })
  sodiumContent: string | null = null;

  @Column({ nullable: true, type: 'varchar' })
  sugarContent: string | null = null;
}

@Entity()
export class InstructionStep {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  type = '';

  @Column()
  text = '';

  @ManyToOne(() => Recipe, (recipe) => recipe.recipeInstructions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recipe_id' })
  recipe!: Recipe;
}

@Entity()
export class Ingredient {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  ingredientId = '';

  @Column()
  name = '';

  @Column()
  unit = '';

  @Column()
  amount = '';

  @ManyToOne(() => Recipe, (recipe) => recipe.recipeIngredient, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recipe_id' })
  recipe!: Recipe;
}

@Entity()
export class Recipe {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name = '';

  @Column()
  description = '';

  @Column({
    type: 'enum',
    enum: Diet,
  })
  diet: Diet = Diet.Meat;

  @Column('simple-array')
  keywords: string[] = [];

  @Column()
  recipeCategory = '';

  @Column()
  recipeCuisine = '';

  @Column()
  recipeYield = -1;

  @Column()
  totalTime = '';

  @UpdateDateColumn()
  lastUpdated = '';

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
