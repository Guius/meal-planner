import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST ? process.env.DATABASE_HOST : 'localhost',
  port: process.env.DATABASE_PORT ? +process.env.DATABASE_PORT : 3306,
  username: process.env.DATABASE_USER ? process.env.DATABASE_USER : 'root',
  password: process.env.DATABASE_PASSWORD
    ? process.env.DATABASE_PASSWORD
    : 'password',
  database: process.env.DATABASE_NAME ? process.env.DATABASE_NAME : 'neptune',
  entities: ['src/entities/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  logging: ['query'],
});
