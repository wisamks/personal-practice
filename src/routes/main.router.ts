import { Router } from 'express';
import authRouter from '@_routes/auth.router';

const router = Router();

router.use('/auth', authRouter);

export default router;