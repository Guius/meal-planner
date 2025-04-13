import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1744548626932 implements MigrationInterface {
  name = 'Initial1744548626932';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`recipe\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NOT NULL, \`diet\` enum ('Non-Meat', 'Meat') NOT NULL, \`keywords\` text NOT NULL, \`recipeCategory\` varchar(255) NOT NULL, \`recipeCuisine\` varchar(255) NOT NULL, \`recipeYield\` varchar(255) NOT NULL, \`totalTime\` varchar(255) NOT NULL, \`lastUpdated\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`nutritionId\` varchar(36) NULL, UNIQUE INDEX \`REL_25dc0c9ee3e4a0de9d19f4c479\` (\`nutritionId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`instruction_step\` ADD CONSTRAINT \`FK_9dd4677cca2a8a182c6d5ad3d59\` FOREIGN KEY (\`recipe_id\`) REFERENCES \`recipe\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ingredient\` ADD CONSTRAINT \`FK_1a884e9b70245ac229ded0d8248\` FOREIGN KEY (\`recipe_id\`) REFERENCES \`recipe\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`recipe\` ADD CONSTRAINT \`FK_25dc0c9ee3e4a0de9d19f4c479a\` FOREIGN KEY (\`nutritionId\`) REFERENCES \`nutrition\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`recipe\` DROP FOREIGN KEY \`FK_25dc0c9ee3e4a0de9d19f4c479a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`ingredient\` DROP FOREIGN KEY \`FK_1a884e9b70245ac229ded0d8248\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`instruction_step\` DROP FOREIGN KEY \`FK_9dd4677cca2a8a182c6d5ad3d59\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_25dc0c9ee3e4a0de9d19f4c479\` ON \`recipe\``,
    );
    await queryRunner.query(`DROP TABLE \`recipe\``);
  }
}
