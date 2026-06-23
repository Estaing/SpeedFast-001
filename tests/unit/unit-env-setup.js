process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'unit_test_jwt_secret_at_least_32_chars_xxxxxxx';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'unit_test_refresh_secret_at_least_32_chars_xxxx';
