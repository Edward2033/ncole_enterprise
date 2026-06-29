import { Router } from 'express';
import { register, login, refresh, logout, forgotPasswordHandler, resetPasswordHandler } from './auth.controller';
import { validate } from '@/middleware/validate';
import { authRateLimiter } from '@/middleware/rateLimiter';
import { registerSchema, loginSchema, refreshSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schema';

const router = Router();

router.post('/register',        authRateLimiter, validate(registerSchema),       register);
router.post('/login',           authRateLimiter, validate(loginSchema),          login);
router.post('/refresh',                          validate(refreshSchema),         refresh);
// logout only requires the refresh token in body — access token may already be expired
router.post('/logout',                           validate(refreshSchema),         logout);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), forgotPasswordHandler);
router.post('/reset-password',  authRateLimiter, validate(resetPasswordSchema),  resetPasswordHandler);

export default router;
