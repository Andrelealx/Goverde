export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  JWT_SECRET: process.env.JWT_SECRET ?? 'dev_secret_change_in_production',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret_change_in_production',
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  UPLOAD_STORAGE: (process.env.UPLOAD_STORAGE ?? 'local') as 'local' | 'r2',
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ?? '',
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ?? '',
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ?? '',
  R2_BUCKET: process.env.R2_BUCKET ?? 'goverde-uploads',
  CORS_ORIGINS: (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:5174').split(','),
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
};
