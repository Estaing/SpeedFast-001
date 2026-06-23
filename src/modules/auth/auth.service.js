import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { ConflictError, UnauthorizedError } from '../../lib/errors.js';
import { env } from '../../config/env.js';

const BCRYPT_ROUNDS = 12;
const REFRESH_KEY_PREFIX = 'refresh:';

export class AuthService {
  constructor(userRepo, redisClient, jwtSigner) {
    this.userRepo = userRepo;
    this.redis = redisClient;
    this.jwt = jwtSigner; // app.jwt — Fastify JWT plugin instance
  }

  async register({ email, password }) {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) throw new ConflictError('An account with this email already exists');

    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.userRepo.create({ email, password: hashed });
    return { id: user.id, email: user.email, role: user.role };
  }

  async login({ email, password }) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new UnauthorizedError('Invalid email or password');

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) throw new UnauthorizedError('Invalid email or password');

    return this._issueTokenPair(user);
  }

  async refresh(refreshToken) {
    const userId = await this.redis.get(`${REFRESH_KEY_PREFIX}${refreshToken}`);
    if (!userId) throw new UnauthorizedError('Invalid or expired refresh token');

    const user = await this.userRepo.findById(userId);
    if (!user) throw new UnauthorizedError('User no longer exists');

    // Rotate: invalidate the old refresh token, issue a brand new pair.
    // This limits the blast radius if a refresh token is ever replayed.
    await this.redis.del(`${REFRESH_KEY_PREFIX}${refreshToken}`);
    return this._issueTokenPair(user);
  }

  async logout(refreshToken) {
    await this.redis.del(`${REFRESH_KEY_PREFIX}${refreshToken}`);
  }

  async _issueTokenPair(user) {
    const accessToken = this.jwt.sign(
      { id: user.id, role: user.role },
      { expiresIn: env.ACCESS_TOKEN_TTL }
    );
    const refreshToken = crypto.randomUUID();
    await this.redis.set(
      `${REFRESH_KEY_PREFIX}${refreshToken}`,
      user.id,
      'EX',
      env.REFRESH_TOKEN_TTL_SECONDS
    );
    return { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } };
  }
}
