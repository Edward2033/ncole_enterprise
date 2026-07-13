import { Request, Response, NextFunction } from 'express';
import { placeOrder, getMyOrders, getMyOrderById, getVendorOrderById, listVendorOrders, listRiderOrders, assignRider, listAllOrders, updateOrderStatus, PlaceOrderDto, UpdateOrderStatusDto } from './orders.service';
import { sendSuccess } from '@/shared/utils/response';
import { prisma } from '@/config/database';
import { Role } from '@prisma/client';

export async function place(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await placeOrder(req.user!.sub, req.body as PlaceOrderDto), 201); } catch (e) { next(e); }
}

export async function myOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await getMyOrderById(req.user!.sub, req.params['id']!);
    sendSuccess(res, order);
  } catch (e) { next(e); }
}

export async function myOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query['page']) || 1);
    const limit = Math.min(50, Number(req.query['limit']) || 10);
    const { orders, total } = await getMyOrders(req.user!.sub, page, limit);
    sendSuccess(res, orders, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
}

export async function vendorOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user!.sub } });
    if (!vendor) { res.status(403).json({ success: false, error: 'No vendor profile' }); return; }
    sendSuccess(res, await getVendorOrderById(vendor.id, req.params['id']!));
  } catch (e) { next(e); }
}

export async function vendorOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query['page']) || 1);
    const limit = Math.min(100, Number(req.query['limit']) || 20);
    // Ownership enforcement — resolve vendor profile from authenticated user
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user!.sub } });
    if (!vendor) { res.status(403).json({ success: false, error: 'No vendor profile' }); return; }
    const { orders, total } = await listVendorOrders(vendor.id, page, limit);
    sendSuccess(res, orders, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
}

export async function riderOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query['page']) || 1);
    const limit = Math.min(50, Number(req.query['limit']) || 20);
    const { orders, total } = await listRiderOrders(req.user!.sub, page, limit);
    sendSuccess(res, orders, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
}

export async function assignRiderToOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { riderId } = req.body as { riderId: string };
    if (!riderId) { res.status(400).json({ success: false, error: 'riderId is required' }); return; }
    sendSuccess(res, await assignRider(req.params['id']!, riderId));
  } catch (e) { next(e); }
}

export async function all(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query['page']) || 1);
    const limit = Math.min(100, Number(req.query['limit']) || 20);
    const { orders, total } = await listAllOrders(page, limit);
    sendSuccess(res, orders, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Ownership enforcement — userId + role passed to service for vendor item-level authorization
    const result = await updateOrderStatus(
      req.params['id']!,
      req.body as UpdateOrderStatusDto,
      req.user!.sub,
      req.user!.role as Role,
    );
    sendSuccess(res, result);
  } catch (e) { next(e); }
}
