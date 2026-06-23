import { registerSchema, loginSchema, refreshSchema } from './auth.schema.js';

export async function registerHandler(req, reply) {
  const input = registerSchema.parse(req.body);
  const user = await req.server.authService.register(input);
  reply.code(201).send(user);
}

export async function loginHandler(req, reply) {
  const input = loginSchema.parse(req.body);
  const result = await req.server.authService.login(input);
  reply.send(result);
}

export async function refreshHandler(req, reply) {
  const { refreshToken } = refreshSchema.parse(req.body);
  const result = await req.server.authService.refresh(refreshToken);
  reply.send(result);
}

export async function logoutHandler(req, reply) {
  const { refreshToken } = refreshSchema.parse(req.body);
  await req.server.authService.logout(refreshToken);
  reply.code(204).send();
}
