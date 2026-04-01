import { Router, Response, NextFunction } from 'express';
import { autenticar, AuthRequest } from '../../middlewares/auth.middleware';
import { validarTenant } from '../../middlewares/tenant.middleware';
import { uploadDocumento } from '../../middlewares/upload.middleware';

const router = Router();
router.use(autenticar, validarTenant);

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

// POST /api/documentos/upload — upload de arquivo
router.post('/upload', (req: AuthRequest, res: Response, next: NextFunction) => {
  uploadDocumento(req, res, (err) => {
    if (err) return next(err);
    const file = (req as any).file;
    if (!file) return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    const url = `${BASE_URL}/uploads/${file.filename}`;
    res.json({ url, filename: file.filename, originalname: file.originalname, size: file.size });
  });
});

export default router;
