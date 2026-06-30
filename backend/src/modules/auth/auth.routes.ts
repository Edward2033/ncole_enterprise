import { Router } from 'express';
import { register, login, verifyOtpHandler, refresh, logout, forgotPasswordHandler, resetPasswordHandler } from './auth.controller';
import { validate } from '@/middleware/validate';
import { authRateLimiter } from '@/middleware/rateLimiter';
import { registerSchema, loginSchema, refreshSchema, forgotPasswordSchema, resetPasswordSchema, otpVerifySchema } from './auth.schema';

const router = Router();

router.post('/register',        authRateLimiter, validate(registerSchema),       register);
router.post('/login',           authRateLimiter, validate(loginSchema),          login);
router.post('/verify-otp',      authRateLimiter, validate(otpVerifySchema),      verifyOtpHandler);
router.post('/refresh',                          validate(refreshSchema),         refresh);
router.post('/logout',                           validate(refreshSchema),         logout);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), forgotPasswordHandler);
router.post('/reset-password',  authRateLimiter, validate(resetPasswordSchema),  resetPasswordHandler);

export default router;
