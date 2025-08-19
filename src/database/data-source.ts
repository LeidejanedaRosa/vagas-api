import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import 'reflect-metadata';

const {
  NODE_ENV,
  TYPEORM_HOST,
  TYPEORM_PORT,
  TYPEORM_PASSWORD,
  TYPEORM_USERNAME,
  TYPEORM_DATABASE,
  CA_CERT,
  DB_TYPE,
  DB_DATABASE,
  DB_SYNCHRONIZE,
} = process.env;

const isTestEnvironment = DB_TYPE === 'sqlite' && DB_DATABASE === ':memory:';

export const typeormConfig: DataSourceOptions = isTestEnvironment
  ? {
      type: 'sqlite',
      database: ':memory:',
      entities: ['src/database/entities/*.entity.ts'],
      synchronize: DB_SYNCHRONIZE === 'true',
      dropSchema: true,
    }
  : {
      type: 'postgres',
      host: TYPEORM_HOST,
      port: parseInt(TYPEORM_PORT),
      username: TYPEORM_USERNAME,
      password: TYPEORM_PASSWORD,
      database: TYPEORM_DATABASE,
      entities: ['dist/database/entities/*.entity.js'],
      migrations: [
        'dist/database/migrations/*.js',
        'dist/database/migrations/seeds/*.js',
      ],
      ssl:
        NODE_ENV == 'production'
          ? {
              ca: CA_CERT,
              rejectUnauthorized: false,
            }
          : undefined,
    };

export const AppDataSource = new DataSource({
  ...typeormConfig,
});
