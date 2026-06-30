import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/shared/utils/response';
import {
  submitApplication,
  listApplications,
  getApplication,
  reviewApplication,
  adminDirectApply,
  submitApplicationSchema,
  reviewApplicationSchema,
} from './applications.service';

export async function handleSubmit(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = submitApplicationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }
    const app = await submitApplication(parsed.data, req.ip);
    sendSuccess(res, app, 201);
  } catch (e) { next(e); }
}

export async function handleList(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query['status'] as string | undefined;
    const role   = req.query['role']   as string | undefined;
    const apps   = await listApplications(status, role);
    sendSuccess(res, apps);
  } catch (e) { next(e); }
}

export async function handleGetOne(req: Request, res: Response, next: NextFunction) {
  try {
    const app = await getApplication(req.params['id']!);
    sendSuccess(res, app);
  } catch (e) { next(e); }
}

export async function handleReview(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = reviewApplicationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }
    const app = await reviewApplication(req.params['id']!, parsed.data, req.user!.sub);
    sendSuccess(res, app);
  } catch (e) { next(e); }
}

export async function handleAdminApply(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = submitApplicationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }
    const autoApprove = req.body.autoApprove === true;
    const app = await adminDirectApply(parsed.data, req.user!.sub, autoApprove);
    sendSuccess(res, app, 201);
  } catch (e) { next(e); }
}
