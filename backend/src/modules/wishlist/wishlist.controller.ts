import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/shared/utils/response';
import {
  getWishlist, addToWishlist, removeFromWishlist,
  clearWishlist, isInWishlist,
} from './wishlist.service';

export async function getHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await getWishlist(req.user!.sub)); } catch (e) { next(e); }
}

export async function addHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { productId } = req.body as { productId: string };
    sendSuccess(res, await addToWishlist(req.user!.sub, productId), 201);
  } catch (e) { next(e); }
}

export async function removeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await removeFromWishlist(req.user!.sub, req.params['productId']!);
    sendSuccess(res, null);
  } catch (e) { next(e); }
}

export async function clearHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await clearWishlist(req.user!.sub);
    sendSuccess(res, null);
  } catch (e) { next(e); }
}

export async function checkHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const inList = await isInWishlist(req.user!.sub, req.params['productId']!);
    sendSuccess(res, { inWishlist: inList });
  } catch (e) { next(e); }
}
