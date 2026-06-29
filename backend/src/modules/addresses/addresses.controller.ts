import { Request, Response, NextFunction } from 'express';
import { listAddresses, createAddress, updateAddress, deleteAddress, CreateAddressDto, UpdateAddressDto } from './addresses.service';
import { sendSuccess } from '@/shared/utils/response';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await listAddresses(req.user!.sub)); } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await createAddress(req.user!.sub, req.body as CreateAddressDto), 201); } catch (e) { next(e); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await updateAddress(req.params['id']!, req.user!.sub, req.body as UpdateAddressDto)); } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await deleteAddress(req.params['id']!, req.user!.sub)); } catch (e) { next(e); }
}
