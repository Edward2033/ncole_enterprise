/**
 * Image Upload Route — POST /products/upload-image
 * Accepts a multipart file, uploads to Cloudinary, returns the secure URL.
 * Requires auth (ADMIN or VENDOR).
 * Max file size: 5 MB. Allowed types: jpeg, png, webp, gif.
 */
import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { env } from '@/config/env';
import { AppError } from '@/shared/errors/AppError';
import { sendSuccess } from '@/shared/utils/response';

const router = Router();

// ── Multer — memory storage, 5 MB limit ────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
  },
});

// ── Cloudinary config (lazy — only when creds present) ────────────────────────
function getCloudinary() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw AppError.internal('Cloudinary is not configured. Set CLOUDINARY_* env vars.');
  }
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
}

function uploadBufferToCloudinary(buffer: Buffer, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const cld = getCloudinary();
    const stream = cld.uploader.upload_stream(
      { folder, resource_type: 'image', quality: 'auto', fetch_format: 'auto' },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error('Upload failed'));
        resolve(result.secure_url);
      },
    );
    Readable.from(buffer).pipe(stream);
  });
}

// POST /products/upload-image
router.post(
  '/upload-image',
  authenticate,
  authorize('ADMIN', 'VENDOR'),
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw AppError.badRequest('No image file provided');
      const url = await uploadBufferToCloudinary(req.file.buffer, 'ncole/products');
      sendSuccess(res, { url });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
