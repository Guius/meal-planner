import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
