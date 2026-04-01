import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of err.errors) {
      const field = issue.path.join('.');
      if (!errors[field]) errors[field] = [];
      errors[field].push(issue.message);
    }
    res.status(422).json({ message: 'Dados inválidos', errors });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  console.error(err);

  res.status(500).json({
    message: 'Erro interno do servidor',
    ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
