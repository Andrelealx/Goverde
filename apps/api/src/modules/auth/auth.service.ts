import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import prisma from '../../prisma/client';
import { env } from '../../config/env';
import { AppError } from '../../middlewares/error.middleware';
import { JwtPayload } from '@goverde/shared';

const ACCESS_TOKEN_TTL = '8h';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function gerarAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

export async function login(email: string, senha: string) {
  const usuario = await prisma.usuario.findFirst({
    where: { email, ativo: true },
    include: { tenant: { select: { id: true, slug: true, nome: true, ativo: true } } },
  });

  if (!usuario || !usuario.tenant.ativo) {
    throw new AppError('E-mail ou senha inválidos', 401);
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaValida) {
    throw new AppError('E-mail ou senha inválidos', 401);
  }

  const payload: JwtPayload = {
    sub: usuario.id,
    tenantId: usuario.tenantId,
    papel: usuario.papel as JwtPayload['papel'],
    email: usuario.email,
  };

  const accessToken = gerarAccessToken(payload);

  const refreshToken = uuid();
  await prisma.refreshToken.create({
    data: {
      usuarioId: usuario.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return {
    accessToken,
    refreshToken,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
      tenantId: usuario.tenantId,
      tenant: { nome: usuario.tenant.nome, slug: usuario.tenant.slug },
    },
  };
}

export async function refresh(refreshToken: string) {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError('Refresh token inválido ou expirado', 401);
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: stored.usuarioId },
    include: { tenant: { select: { ativo: true } } },
  });

  if (!usuario || !usuario.ativo || !usuario.tenant.ativo) {
    throw new AppError('Refresh token inválido ou expirado', 401);
  }

  // Rotate refresh token
  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const newRefreshToken = uuid();
  await prisma.refreshToken.create({
    data: {
      usuarioId: stored.usuarioId,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  const payload: JwtPayload = {
    sub: stored.usuarioId,
    tenantId: usuario.tenantId,
    papel: usuario.papel as JwtPayload['papel'],
    email: usuario.email,
  };

  const accessToken = gerarAccessToken(payload);

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
}

export async function me(usuarioId: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      nome: true,
      email: true,
      papel: true,
      tenantId: true,
      tenant: { select: { nome: true, municipio: true, estado: true, slug: true, plano: true } },
    },
  });

  if (!usuario) throw new AppError('Usuário não encontrado', 404);
  return usuario;
}
