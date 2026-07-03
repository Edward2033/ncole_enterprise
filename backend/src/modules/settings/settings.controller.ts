import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/shared/utils/response';
import {
  getPlatformConfig, updatePlatformConfig,
  listHeroSlides, createHeroSlide, updateHeroSlide, deleteHeroSlide, reorderHeroSlides,
  listBanners, listActiveBanners, createBanner, updateBanner, deleteBanner,
  getMaintenanceConfig, updateMaintenanceConfig,
  getSiteSettings, updateSiteSettings,
  getHeaderSettings, updateHeaderSettings,
  listTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
} from './settings.service';

// ─── Platform ─────────────────────────────────────────────────────────────────

export async function getPlatform(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await getPlatformConfig()); } catch (e) { next(e); }
}

export async function patchPlatform(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await updatePlatformConfig(req.body)); } catch (e) { next(e); }
}

// ─── Hero Slides ──────────────────────────────────────────────────────────────

export async function getSlides(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await listHeroSlides()); } catch (e) { next(e); }
}

export async function postSlide(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await createHeroSlide(req.body), 201); } catch (e) { next(e); }
}

export async function patchSlide(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await updateHeroSlide(req.params['id']!, req.body)); } catch (e) { next(e); }
}

export async function deleteSlide(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { await deleteHeroSlide(req.params['id']!); sendSuccess(res, null); } catch (e) { next(e); }
}

export async function reorderSlides(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await reorderHeroSlides(req.body.ids as string[])); } catch (e) { next(e); }
}

// ─── Banners ──────────────────────────────────────────────────────────────────

export async function getBanners(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await listBanners()); } catch (e) { next(e); }
}

export async function getActiveBanners(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await listActiveBanners()); } catch (e) { next(e); }
}

export async function postBanner(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await createBanner(req.body), 201); } catch (e) { next(e); }
}

export async function patchBanner(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await updateBanner(req.params['id']!, req.body)); } catch (e) { next(e); }
}

export async function deleteBanner_(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { await deleteBanner(req.params['id']!); sendSuccess(res, null); } catch (e) { next(e); }
}

// ─── Header Settings ──────────────────────────────────────────────────────────

export async function getHeaderSettingsHandler(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await getHeaderSettings()); } catch (e) { next(e); }
}

export async function patchHeaderSettingsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await updateHeaderSettings(req.body)); } catch (e) { next(e); }
}

// ─── Site Settings ────────────────────────────────────────────────────────────

export async function getSiteSettingsHandler(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await getSiteSettings()); } catch (e) { next(e); }
}

export async function putSiteSettingsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await updateSiteSettings(req.body)); } catch (e) { next(e); }
}

// ─── Maintenance ──────────────────────────────────────────────────────────────

export async function getMaintenance(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await getMaintenanceConfig()); } catch (e) { next(e); }
}

export async function patchMaintenance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await updateMaintenanceConfig(req.body)); } catch (e) { next(e); }
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

export async function getTestimonialsHandler(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await listTestimonials()); } catch (e) { next(e); }
}

export async function postTestimonialHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await createTestimonial(req.body), 201); } catch (e) { next(e); }
}

export async function patchTestimonialHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await updateTestimonial(req.params['id']!, req.body)); } catch (e) { next(e); }
}

export async function deleteTestimonialHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { await deleteTestimonial(req.params['id']!); sendSuccess(res, null); } catch (e) { next(e); }
}
