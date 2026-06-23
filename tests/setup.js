import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer } from '@testcontainers/redis';
import { execSync } from 'node:child_process';

let pgContainer;
let redisContainer;

export async function setupTestInfra() {
  pgContainer = await new PostgreSqlContainer('postgres:16-alpine').start();
  redisContainer = await new RedisContainer('redis:7-alpine').start();

  const databaseUrl = pgContainer.getConnectionUri();
  const redisUrl = `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;

  process.env.DATABASE_URL = databaseUrl;
  process.env.REDIS_URL = redisUrl;
  process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_characters_long_xxxx';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_characters_xxxx';
  process.env.NODE_ENV = 'test';

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });

  return { databaseUrl, redisUrl };
}

export async function teardownTestInfra() {
  await pgContainer?.stop();
  await redisContainer?.stop();
}
