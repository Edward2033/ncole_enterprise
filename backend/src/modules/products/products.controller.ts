import { Request, Response, NextFunction } from 'express';
import {
  listProducts, getProductById, createProduct, updateProduct, deleteProduct,
  CreateProductDto, UpdateProductDto, ProductQueryDto,
} from './products.service';
import { sendSuccess } from '@/shared/utils/response';
import { Role } from '@prisma/client';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as ProductQueryDto;
    const { products, total } = await listProducts(query);
    const { page = 1, limit = 20 } = query;
    sendSuccess(res, products, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await getProductById(req.params['id']!)); } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await createProduct(req.body as CreateProductDto, req.user!.sub, req.user!.role as Role);
    sendSuccess(res, product, 201);
  } catch (e) { next(e); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await updateProduct(req.params['id']!, req.body as UpdateProductDto, req.user!.sub, req.user!.role as Role);
    sendSuccess(res, product);
  } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Ownership enforcement — vendor-scoped authorization delegated to service
  try { sendSuccess(res, await deleteProduct(req.params['id']!, req.user!.sub, req.user!.role as Role)); } catch (e) { next(e); }
}
