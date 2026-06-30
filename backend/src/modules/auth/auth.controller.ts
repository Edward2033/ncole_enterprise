import { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser, loginVerifyOtp, refreshTokens, logoutUser, forgotPassword, resetPassword } from './auth.service';
import { sendSuccess } from '@/shared/utils/response';
import { RegisterDto, LoginDto, RefreshDto, ForgotPasswordDto, ResetPasswordDto, OtpVerifyDto } from './auth.schema';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tokens = await registerUser(req.body as RegisterDto);
    sendSuccess(res, tokens, 201);
  } catch (err) { next(err); }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await loginUser(req.body as LoginDto);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function verifyOtpHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId, code } = req.body as OtpVerifyDto;
    const tokens = await loginVerifyOtp(userId, code);
    sendSuccess(res, tokens);
  } catch (err) { next(err); }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body as RefreshDto;
    const tokens = await refreshTokens(refreshToken);
    sendSuccess(res, tokens);
  } catch (err) { next(err); }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body as RefreshDto;
    await logoutUser(refreshToken);
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) { next(err); }
}

export async function forgotPasswordHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await forgotPassword(req.body as ForgotPasswordDto);
    sendSuccess(res, { message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) { next(err); }
}

export async function resetPasswordHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await resetPassword(req.body as ResetPasswordDto);
    sendSuccess(res, { message: 'Password reset successfully. Please sign in with your new password.' });
  } catch (err) { next(err); }
}
