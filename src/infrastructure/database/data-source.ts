import 'dotenv/config';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export default new DataSource({
  type: 'postgres',

  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  entities: ['src/**/*.orm-entity.ts'],
  migrations: ['src/infrastructure/database/migrations/*.ts'],

  namingStrategy: new SnakeNamingStrategy(),

  synchronize: false,
  logging: true
});