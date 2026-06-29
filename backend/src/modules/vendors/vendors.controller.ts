import { Request, Response, NextFunction } from 'express';
import { listVendors, getVendorByUserId, getVendorById, createVendor, updateVendor, backfillVendors, CreateVendorDto, UpdateVendorDto } from './vendors.service';
import { sendSuccess } from '@/shared/utils/response';

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await getVendorByUserId(req.user!.sub)); } catch (e) { next(e); }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  const all = req.query['all'] === 'true' && req.user?.role === 'ADMIN';
  try { sendSuccess(res, await listVendors(all)); } catch (e) { next(e); }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await getVendorById(req.params['id']!)); } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await createVendor(req.body as CreateVendorDto), 201); } catch (e) { next(e); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await updateVendor(req.params['id']!, req.body as UpdateVendorDto)); } catch (e) { next(e); }
}

export async function backfill(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await backfillVendors()); } catch (e) { next(e); }
}
