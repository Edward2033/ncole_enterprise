import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import {
  platformPatchSchema, heroSlideSchema, heroSlidePatchSchema,
  bannerSchema, bannerPatchSchema, maintenancePatchSchema,
  siteSettingsPatchSchema, testimonialSchema, testimonialPatchSchema,
} from './settings.service';
import {
  getPlatform, patchPlatform,
  getSlides, postSlide, patchSlide, deleteSlide, reorderSlides,
  getBanners, postBanner, patchBanner, deleteBanner_,
  getMaintenance, patchMaintenance,
  getSiteSettingsHandler, putSiteSettingsHandler,
  getTestimonialsHandler, postTestimonialHandler, patchTestimonialHandler, deleteTestimonialHandler,
} from './settings.controller';

const router = Router();

// ─── Public maintenance status check (no auth — used by frontend to show maintenance page) ───
router.get('/maintenance/status', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { getMaintenanceConfig } = await import('./settings.service');
    const config = await getMaintenanceConfig();
    res.json({ success: true, data: { enabled: config.enabled, message: config.message } });
  } catch (e) { next(e); }
});

// ─── Public hero slides (no auth — used by the storefront Hero component) ─────
router.get('/hero-slides/public', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { listHeroSlides } = await import('./settings.service');
    const slides = await listHeroSlides();
    res.json({ success: true, data: slides.filter(s => s.isActive) });
  } catch (e) { next(e); }
});

// ─── Public site settings (footer/contact/social — no auth) ──────────────────
router.get('/site', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { getSiteSettings } = await import('./settings.service');
    res.json({ success: true, data: await getSiteSettings() });
  } catch (e) { next(e); }
});

// All other settings routes require authentication.
router.use(authenticate);

// ─── Platform ─────────────────────────────────────────────────────────────────
router.get( '/platform',     authorize('ADMIN'), getPlatform);
router.patch('/platform',    authorize('ADMIN'), validate(platformPatchSchema), patchPlatform);

// ─── Hero Slides ──────────────────────────────────────────────────────────────
router.get(   '/hero-slides',          authorize('ADMIN'), getSlides);
router.post(  '/hero-slides',          authorize('ADMIN'), validate(heroSlideSchema), postSlide);
router.patch( '/hero-slides/reorder',  authorize('ADMIN'), reorderSlides);
router.patch( '/hero-slides/:id',      authorize('ADMIN'), validate(heroSlidePatchSchema), patchSlide);
router.delete('/hero-slides/:id',      authorize('ADMIN'), deleteSlide);

// ─── Banners ──────────────────────────────────────────────────────────────────
router.get(   '/banners',     authorize('ADMIN'), getBanners);
router.post(  '/banners',     authorize('ADMIN'), validate(bannerSchema), postBanner);
router.patch( '/banners/:id', authorize('ADMIN'), validate(bannerPatchSchema), patchBanner);
router.delete('/banners/:id', authorize('ADMIN'), deleteBanner_);

// ─── Maintenance ──────────────────────────────────────────────────────────────
router.get(  '/maintenance', authorize('ADMIN'), getMaintenance);
router.patch('/maintenance', authorize('ADMIN'), validate(maintenancePatchSchema), patchMaintenance);

// ─── Site Settings ────────────────────────────────────────────────────────────
router.get('/site-settings', authorize('ADMIN'), getSiteSettingsHandler);
router.put('/site-settings', authorize('ADMIN'), validate(siteSettingsPatchSchema), putSiteSettingsHandler);

// ─── Testimonials (public read, admin write) ──────────────────────────────────
router.get('/testimonials/public', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { listTestimonials } = await import('./settings.service');
    const all = await listTestimonials();
    res.json({ success: true, data: all.filter(t => t.isPublished) });
  } catch (e) { next(e); }
});
router.get(   '/testimonials',     authorize('ADMIN'), getTestimonialsHandler);
router.post(  '/testimonials',     authorize('ADMIN'), validate(testimonialSchema), postTestimonialHandler);
router.patch( '/testimonials/:id', authorize('ADMIN'), validate(testimonialPatchSchema), patchTestimonialHandler);
router.delete('/testimonials/:id', authorize('ADMIN'), deleteTestimonialHandler);

export default router;
