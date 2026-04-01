import { Request, Response, NextFunction } from 'express';
import { loginSchema } from '@goverde/shared';
import * as authService from './auth.service';
import { AuthRequest } from '../../middlewares/auth.middleware';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, senha } = loginSchema.parse(req.body);
    const result = await authService.login(email, senha);

    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTS);

    res.json({
      accessToken: result.accessToken,
      usuario: result.usuario,
    });
  } catch (err) {
    next(err);
  }
}

export async function refreshHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({ message: 'Refresh token não encontrado' });
      return;
    }

    const result = await authService.refresh(token);
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTS);
    res.json({ accessToken: result.accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logoutHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken;
    if (token) await authService.logout(token);
    res.clearCookie('refreshToken');
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (err) {
    next(err);
  }
}

export async function meHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const usuario = await authService.me(req.usuario!.sub);
    res.json(usuario);
  } catch (err) {
    next(err);
  }
}
