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
  DB_SSL_REJECT_UNAUTHORIZED,
} = process.env;

/**
 * Normalizes CA certificate from environment variable
 * Replaces escaped newlines with actual newlines
 * @param caCert - Raw CA certificate string from environment
 * @returns Normalized CA certificate or undefined if empty
 */
const normalizeCACert = (caCert: string | undefined): string | undefined => {
  if (!caCert || caCert.trim() === '') return undefined;
  return caCert.replace(/\\n/g, '\n');
};

/**
 * Creates SSL configuration for production environment
 * Uses strict security defaults with option to override via explicit env flag
 * @returns SSL configuration object or undefined
 */
const createSSLConfig = () => {
  if (NODE_ENV !== 'production') return undefined;

  const normalizedCACert = normalizeCACert(CA_CERT);
  if (!normalizedCACert) return undefined;

  // Default to secure setting (reject unauthorized certificates)
  const rejectUnauthorized =
    DB_SSL_REJECT_UNAUTHORIZED === 'false' || DB_SSL_REJECT_UNAUTHORIZED === '0'
      ? false
      : true;

  // Log security warning when using insecure setting
  if (!rejectUnauthorized) {
    console.warn(
      '⚠️  WARNING: Database SSL is configured with rejectUnauthorized: false. ' +
        'This setting bypasses certificate validation and should only be used in development. ' +
        'Set DB_SSL_REJECT_UNAUTHORIZED=true or remove this environment variable for secure production deployment.',
    );
  }

  return {
    ca: normalizedCACert,
    rejectUnauthorized,
  };
};

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
      ssl: createSSLConfig(),
    };

export const AppDataSource = new DataSource({
  ...typeormConfig,
});
