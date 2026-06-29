import { Request, Response, NextFunction } from 'express';
import { getMe, updateMe, listUsers, adminUpdateUser, adminCreateUser, changePassword, UpdateProfileDto, AdminUpdateUserDto, CreateUserDto, ChangePasswordDto } from './users.service';
import { sendSuccess } from '@/shared/utils/response';

export async function getMeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await getMe(req.user!.sub);
    sendSuccess(res, user);
  } catch (err) { next(err); }
}

export async function updateMeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await updateMe(req.user!.sub, req.body as UpdateProfileDto);
    sendSuccess(res, user);
  } catch (err) { next(err); }
}

export async function listUsersHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query['page']) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 20));
    const { users, total } = await listUsers(page, limit);
    sendSuccess(res, users, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}

export async function adminUpdateUserHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await adminUpdateUser(req.params['id']!, req.body as AdminUpdateUserDto);
    sendSuccess(res, user);
  } catch (err) { next(err); }
}

export async function adminCreateUserHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await adminCreateUser(req.body as CreateUserDto);
    sendSuccess(res, user, 201);
  } catch (err) { next(err); }
}

export async function changePasswordHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await changePassword(req.user!.sub, req.body as ChangePasswordDto);
    sendSuccess(res, { message: 'Password changed successfully' });
  } catch (err) { next(err); }
}
