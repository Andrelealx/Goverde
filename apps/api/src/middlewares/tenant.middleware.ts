import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import prisma from '../prisma/client';

export async function validarTenant(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.usuario) {
    res.status(401).json({ message: 'Não autenticado' });
    return;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: req.usuario.tenantId },
    select: { id: true, ativo: true },
  });

  if (!tenant || !tenant.ativo) {
    res.status(403).json({ message: 'Tenant inativo ou não encontrado' });
    return;
  }

  next();
}
