import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload, Papel } from '@goverde/shared';

export interface AuthRequest extends Request {
  usuario?: JwtPayload;
}

export function autenticar(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token de autenticação não fornecido' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.usuario = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido ou expirado' });
  }
}

export function autorizar(...papeis: Papel[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      res.status(401).json({ message: 'Não autenticado' });
      return;
    }

    if (!papeis.includes(req.usuario.papel)) {
      res.status(403).json({ message: 'Sem permissão para esta ação' });
      return;
    }

    next();
  };
}
