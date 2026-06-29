import { Request, Response, NextFunction } from 'express';
import { getCart, addItem, updateItem, removeItem, clearCart, AddCartItemDto, UpdateCartItemDto } from './cart.service';
import { sendSuccess } from '@/shared/utils/response';

export async function get(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await getCart(req.user!.sub)); } catch (e) { next(e); }
}

export async function add(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await addItem(req.user!.sub, req.body as AddCartItemDto), 201); } catch (e) { next(e); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await updateItem(req.user!.sub, req.params['id']!, req.body as UpdateCartItemDto)); } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await removeItem(req.user!.sub, req.params['id']!)); } catch (e) { next(e); }
}

export async function clear(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await clearCart(req.user!.sub)); } catch (e) { next(e); }
}
