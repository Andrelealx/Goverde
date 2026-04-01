import { Router } from 'express';
import { loginHandler, refreshHandler, logoutHandler, meHandler } from './auth.controller';
import { autenticar } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/login', loginHandler);
router.post('/refresh', refreshHandler);
router.post('/logout', logoutHandler);
router.get('/me', autenticar, meHandler);

export default router;
