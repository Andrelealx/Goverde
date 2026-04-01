import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { AppError } from './error.middleware';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

const UPLOADS_DIR = path.resolve(__dirname, '../../../../uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.', 400));
  }
};

export const uploadFotos = multer({
  storage,
  limits: { fileSize: MAX_SIZE, files: MAX_FILES },
  fileFilter,
}).array('fotos', MAX_FILES);

const docFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (ALLOWED_DOC_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Tipo de arquivo não permitido. Use PDF, JPEG ou PNG.', 400));
  }
};

export const uploadDocumento = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: docFilter,
}).single('arquivo');
