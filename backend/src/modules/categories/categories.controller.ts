import { Request, Response, NextFunction } from 'express';
import {
  listCategories, createCategory, updateCategory, deleteCategory,
  CreateCategoryDto, UpdateCategoryDto,
} from './categories.service';
import { sendSuccess } from '@/shared/utils/response';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // ?all=true is honoured only for authenticated admins; unauthenticated requests get visible-only
    const all = req.query['all'] === 'true' && req.user?.role === 'ADMIN';
    sendSuccess(res, await listCategories(all));
  } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await createCategory(req.body as CreateCategoryDto), 201); } catch (e) { next(e); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await updateCategory(req.params['id']!, req.body as UpdateCategoryDto)); } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await deleteCategory(req.params['id']!)); } catch (e) { next(e); }
}
