import { prisma } from '@/config/database';
import { z } from 'zod';

// ─── Bootstrap ────────────────────────────────────────────────────────────────
let bootstrapped = false;

async function bootstrap() {
  if (bootstrapped) return;
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS platform_settings (
      key   TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  bootstrapped = true;
}

async function get<T>(key: string, fallback: T): Promise<T> {
  await bootstrap();
  const rows = await prisma.$queryRaw<{ value: T }[]>`
    SELECT value FROM platform_settings WHERE key = ${key}
  `;
  return rows.length > 0 ? (rows[0].value as T) : fallback;
}

async function set<T>(key: string, value: T): Promise<void> {
  await bootstrap();
  await prisma.$executeRaw`
    INSERT INTO platform_settings (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}::jsonb, now())
    ON CONFLICT (key) DO UPDATE
      SET value = ${JSON.stringify(value)}::jsonb,
          updated_at = now()
  `;
}

// ─── Platform Config ──────────────────────────────────────────────────────────

export const platformSchema = z.object({
  platformName:      z.string().min(1).max(100),
  version:           z.string().min(1).max(20),
  storefrontUrl:     z.string().url(),
  customerPortalUrl: z.string().url(),
  vendorPortalUrl:   z.string().url(),
  riderPortalUrl:    z.string().url(),
});

export const platformPatchSchema = platformSchema.partial();
export type PlatformConfig = z.infer<typeof platformSchema>;

const PLATFORM_DEFAULTS: PlatformConfig = {
  platformName:      'Ncole Interpress',
  version:           '1.0.0',
  storefrontUrl:     'https://ncoleinterpress.com',
  customerPortalUrl: 'https://app.ncoleinterpress.com',
  vendorPortalUrl:   'https://vendors.ncoleinterpress.com',
  riderPortalUrl:    'https://rider.ncoleinterpress.com',
};

export async function getPlatformConfig(): Promise<PlatformConfig> {
  return get('platform', PLATFORM_DEFAULTS);
}

export async function updatePlatformConfig(dto: Partial<PlatformConfig>): Promise<PlatformConfig> {
  const current = await getPlatformConfig();
  const updated = { ...current, ...dto };
  await set('platform', updated);
  return updated;
}

// ─── Hero Slides ──────────────────────────────────────────────────────────────

export const heroSlideSchema = z.object({
  title:       z.string().min(1).max(200),
  subtitle:    z.string().max(500).optional(),
  imageUrl:    z.string().min(1),
  buttonText:  z.string().max(100).optional(),
  buttonLink:  z.string().max(500).optional(),
  isActive:    z.boolean().default(true),
  sortOrder:   z.number().int().default(0),
});

export const heroSlidePatchSchema = heroSlideSchema.partial();

export interface HeroSlide extends z.infer<typeof heroSlideSchema> {
  id: string;
  createdAt: string;
}

export async function listHeroSlides(): Promise<HeroSlide[]> {
  const slides = await get<HeroSlide[]>('hero_slides', []);
  return [...slides].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createHeroSlide(dto: z.infer<typeof heroSlideSchema>): Promise<HeroSlide> {
  const slides = await listHeroSlides();
  const slide: HeroSlide = { ...dto, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  await set('hero_slides', [...slides, slide]);
  return slide;
}

export async function updateHeroSlide(id: string, dto: Partial<z.infer<typeof heroSlideSchema>>): Promise<HeroSlide> {
  const slides = await listHeroSlides();
  const idx = slides.findIndex(s => s.id === id);
  if (idx === -1) throw new Error('Slide not found');
  slides[idx] = { ...slides[idx], ...dto };
  await set('hero_slides', slides);
  return slides[idx];
}

export async function deleteHeroSlide(id: string): Promise<void> {
  const slides = await listHeroSlides();
  const filtered = slides.filter(s => s.id !== id);
  if (filtered.length === slides.length) throw new Error('Slide not found');
  await set('hero_slides', filtered);
}

export async function reorderHeroSlides(ids: string[]): Promise<HeroSlide[]> {
  const slides = await listHeroSlides();
  const reordered = ids.map((id, i) => {
    const s = slides.find(x => x.id === id);
    if (!s) throw new Error(`Slide ${id} not found`);
    return { ...s, sortOrder: i };
  });
  await set('hero_slides', reordered);
  return reordered;
}

// ─── Banners ──────────────────────────────────────────────────────────────────

export const bannerSchema = z.object({
  title:       z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  imageUrl:    z.string().min(1),
  buttonText:  z.string().max(100).optional(),
  linkUrl:     z.string().max(500).optional(),
  isActive:    z.boolean().default(true),
  startDate:   z.string().datetime().optional().or(z.literal('')).transform(v => v || undefined),
  endDate:     z.string().datetime().optional().or(z.literal('')).transform(v => v || undefined),
});

export const bannerPatchSchema = bannerSchema.partial();

export interface Banner extends z.infer<typeof bannerSchema> {
  id: string;
  createdAt: string;
}

export async function listBanners(): Promise<Banner[]> {
  const banners = await get<Banner[]>('banners', []);
  return Array.isArray(banners) ? banners : [];
}

export async function listActiveBanners(): Promise<Banner[]> {
  const banners = await listBanners();
  const now = new Date();
  return banners.filter(b => {
    if (!b.isActive) return false;
    if (b.startDate && new Date(b.startDate) > now) return false;
    if (b.endDate   && new Date(b.endDate)   < now) return false;
    return true;
  });
}

export async function createBanner(dto: z.infer<typeof bannerSchema>): Promise<Banner> {
  const banners = await listBanners();
  const banner: Banner = { ...dto, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  await set('banners', [...banners, banner]);
  return banner;
}

export async function updateBanner(id: string, dto: Partial<z.infer<typeof bannerSchema>>): Promise<Banner> {
  const banners = await listBanners();
  const idx = banners.findIndex(b => b.id === id);
  if (idx === -1) throw new Error('Banner not found');
  banners[idx] = { ...banners[idx], ...dto };
  await set('banners', banners);
  return banners[idx];
}

export async function deleteBanner(id: string): Promise<void> {
  const banners = await listBanners();
  const filtered = banners.filter(b => b.id !== id);
  if (filtered.length === banners.length) throw new Error('Banner not found');
  await set('banners', filtered);
}

// ─── Header Settings ──────────────────────────────────────────────────────────

export const headerSettingsSchema = z.object({
  siteName:          z.string().max(100).optional().or(z.literal('')),
  headerTitle:       z.string().max(200).optional().or(z.literal('')),
  headerSubtitle:    z.string().max(300).optional().or(z.literal('')),
  logoUrl:           z.string().optional().or(z.literal('')),
  headerLogoUrl:     z.string().optional().or(z.literal('')),
  faviconUrl:        z.string().optional().or(z.literal('')),
  headerBgColor:     z.string().max(50).optional().or(z.literal('')),
  headerTextColor:   z.string().max(50).optional().or(z.literal('')),
  headerBgImage:     z.string().optional().or(z.literal('')),
  navLinks: z.array(z.object({
    label: z.string().max(50),
    url:   z.string().max(200),
  })).optional(),
});

export const headerSettingsPatchSchema = headerSettingsSchema.partial();
export type HeaderSettings = z.infer<typeof headerSettingsSchema>;

const HEADER_SETTINGS_DEFAULTS: HeaderSettings = {
  siteName:        'Ncole Interpress',
  headerTitle:     'Ncole Interpress',
  headerSubtitle:  "Rwanda's Premier Multi-Vendor Marketplace",
  logoUrl:         '',
  headerLogoUrl:   '',
  faviconUrl:      '',
  headerBgColor:   '#ffffff',
  headerTextColor: '#0f172a',
  headerBgImage:   '',
  navLinks: [
    { label: 'Home',  url: '/' },
    { label: 'Shop',  url: '/shop' },
    { label: 'Apply', url: '/apply' },
  ],
};

export async function getHeaderSettings(): Promise<HeaderSettings> {
  return get('header_settings', HEADER_SETTINGS_DEFAULTS);
}

export async function updateHeaderSettings(dto: Partial<HeaderSettings>): Promise<HeaderSettings> {
  const current = await getHeaderSettings();
  const updated = { ...current, ...dto };
  await set('header_settings', updated);
  return updated;
}

// ─── Site Settings ────────────────────────────────────────────────────────────

export const siteSettingsSchema = z.object({
  siteName:       z.string().min(1).max(100),
  supportEmail:   z.string().email(),
  contactEmail:   z.string().email(),
  whatsappNumber: z.string().max(20),
  phoneNumber:    z.string().max(20),
  githubUrl:      z.string().url().optional().or(z.literal('')),
  linkedinUrl:    z.string().url().optional().or(z.literal('')),
  facebookUrl:    z.string().url().optional().or(z.literal('')),
  twitterUrl:     z.string().url().optional().or(z.literal('')),
  footerText:     z.string().max(300).optional().or(z.literal('')),
  address:        z.string().max(200).optional().or(z.literal('')),
});

export const siteSettingsPatchSchema = siteSettingsSchema.partial();
export type SiteSettings = z.infer<typeof siteSettingsSchema>;

const SITE_SETTINGS_DEFAULTS: SiteSettings = {
  siteName:       'Ncole Interpress',
  supportEmail:   'support@ncoleinterpress.com',
  contactEmail:   'hello@ncoleinterpress.com',
  whatsappNumber: '+250794890144',
  phoneNumber:    '+250794890144',
  githubUrl:      'https://github.com/Edward2033',
  linkedinUrl:    '',
  facebookUrl:    'https://facebook.com/edwardycole',
  twitterUrl:     '',
  footerText:     "Rwanda's premier multi-vendor e-commerce marketplace. Powered by AI. Built for Africa.",
  address:        'KG 8 Ave, Kigali, Rwanda',
};

export async function getSiteSettings(): Promise<SiteSettings> {
  return get('site_settings', SITE_SETTINGS_DEFAULTS);
}

export async function updateSiteSettings(dto: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await getSiteSettings();
  const updated = { ...current, ...dto };
  await set('site_settings', updated);
  return updated;
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

export const testimonialSchema = z.object({
  name:        z.string().min(1).max(100),
  role:        z.string().max(100).default(''),
  rating:      z.number().int().min(1).max(5).default(5),
  text:        z.string().min(1).max(1000),
  photoUrl:    z.string().url().optional().or(z.literal('')),
  isPublished: z.boolean().default(false),
});

export const testimonialPatchSchema = testimonialSchema.partial();

export interface Testimonial extends z.infer<typeof testimonialSchema> {
  id: string;
  createdAt: string;
}

export async function listTestimonials(): Promise<Testimonial[]> {
  return get<Testimonial[]>('testimonials', []);
}

export async function createTestimonial(dto: z.infer<typeof testimonialSchema>): Promise<Testimonial> {
  const all = await listTestimonials();
  const item: Testimonial = { ...dto, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  await set('testimonials', [...all, item]);
  return item;
}

export async function updateTestimonial(id: string, dto: Partial<z.infer<typeof testimonialSchema>>): Promise<Testimonial> {
  const all = await listTestimonials();
  const idx = all.findIndex(t => t.id === id);
  if (idx === -1) throw new Error('Testimonial not found');
  all[idx] = { ...all[idx], ...dto };
  await set('testimonials', all);
  return all[idx];
}

export async function deleteTestimonial(id: string): Promise<void> {
  const all = await listTestimonials();
  const filtered = all.filter(t => t.id !== id);
  if (filtered.length === all.length) throw new Error('Testimonial not found');
  await set('testimonials', filtered);
}

// ─── Maintenance Mode ─────────────────────────────────────────────────────────

export const maintenanceSchema = z.object({
  enabled:      z.boolean(),
  message:      z.string().max(500).default('We are performing scheduled maintenance. Please check back shortly.'),
  allowAdmins:  z.boolean().default(true),
  allowVendors: z.boolean().default(false),
  allowRiders:  z.boolean().default(false),
});

export const maintenancePatchSchema = maintenanceSchema.partial();
export type MaintenanceConfig = z.infer<typeof maintenanceSchema>;

const MAINTENANCE_DEFAULTS: MaintenanceConfig = {
  enabled:      false,
  message:      'We are performing scheduled maintenance. Please check back shortly.',
  allowAdmins:  true,
  allowVendors: false,
  allowRiders:  false,
};

export async function getMaintenanceConfig(): Promise<MaintenanceConfig> {
  return get('maintenance', MAINTENANCE_DEFAULTS);
}

export async function updateMaintenanceConfig(dto: Partial<MaintenanceConfig>): Promise<MaintenanceConfig> {
  const current = await getMaintenanceConfig();
  const updated = { ...current, ...dto };
  await set('maintenance', updated);
  return updated;
}
