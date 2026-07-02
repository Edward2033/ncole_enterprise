/**
 * N_COLE Brand Asset Uploader — drop-folder version
 * 1. Put your logo image  → scripts/brand-images/logo.*
 * 2. Put your OG banner   → scripts/brand-images/og.*   (optional)
 * 3. Run: node scripts/upload-brand-assets.js
 */

const https  = require('https');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const CLOUD_NAME = 'djm0iu76z';
const API_KEY    = '317945151134592';
const API_SECRET = '4mFmYSgZz9Ek6ntwU6NSBcZzsQk';
const FOLDER     = 'ncole/brand';

const IMAGES_DIR = path.join(__dirname, 'brand-images');

// ── Find a file by base name (any extension) ──────────────────────────────────
function findFile(baseName) {
  if (!fs.existsSync(IMAGES_DIR)) return null;
  const files = fs.readdirSync(IMAGES_DIR);
  const match = files.find(f => path.parse(f).name.toLowerCase() === baseName.toLowerCase());
  return match ? path.join(IMAGES_DIR, match) : null;
}

function sha1(str) {
  return crypto.createHash('sha1').update(str).digest('hex');
}

function uploadToCloudinary(filePath, publicId) {
  return new Promise((resolve, reject) => {
    const boundary   = '----Boundary' + Date.now().toString(16);
    const timestamp  = Math.floor(Date.now() / 1000).toString();
    const sigStr     = `folder=${FOLDER}&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
    const signature  = sha1(sigStr);
    const fileBuffer = fs.readFileSync(filePath);
    const filename   = path.basename(filePath);

    const textParts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="api_key"\r\n\r\n${API_KEY}\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="timestamp"\r\n\r\n${timestamp}\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="signature"\r\n\r\n${signature}\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="folder"\r\n\r\n${FOLDER}\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="public_id"\r\n\r\n${publicId}\r\n`,
    ].join('');

    const body = Buffer.concat([
      Buffer.from(textParts),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`),
      fileBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const req = https.request({
      hostname: 'api.cloudinary.com',
      path:     `/v1_1/${CLOUD_NAME}/image/upload`,
      method:   'POST',
      headers:  {
        'Content-Type':   `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.secure_url) resolve(json.secure_url);
          else reject(new Error(json.error?.message || data));
        } catch { reject(new Error('Bad response: ' + data)); }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║  N_COLE Brand Asset Uploader → Cloudinary     ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  // Ensure brand-images folder exists
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
    console.log('✓ Created folder: scripts/brand-images/');
  }

  const logoFile = findFile('logo');
  const ogFile   = findFile('og');

  if (!logoFile) {
    console.log('✗ No logo file found.\n');
    console.log('  Please do the following:');
    console.log('  1. Open the folder:  scripts\\brand-images\\');
    console.log('  2. Copy your logo image there and rename it to:  logo.png  (or logo.jpg / logo.svg)');
    console.log('  3. Optionally copy a banner image and rename it: og.jpg    (1200×630 recommended)');
    console.log('  4. Run this script again: node scripts/upload-brand-assets.js\n');
    process.exit(0);
  }

  console.log('  Found logo :', logoFile);
  console.log('  Found OG   :', ogFile || '(none — will reuse logo)');
  console.log('\nUploading to Cloudinary ncole/brand/ ...\n');

  let logoUrl, ogUrl;

  process.stdout.write('  Uploading logo     → ');
  logoUrl = await uploadToCloudinary(logoFile, 'logo');
  console.log(logoUrl);

  process.stdout.write('  Uploading OG image → ');
  if (ogFile) {
    ogUrl = await uploadToCloudinary(ogFile, 'og-banner');
    console.log(ogUrl);
  } else {
    ogUrl = logoUrl;
    console.log('(reusing logo URL)');
  }

  // Save URLs
  const outFile = path.join(__dirname, 'brand-asset-urls.json');
  fs.writeFileSync(outFile, JSON.stringify({ logoUrl, ogUrl }, null, 2));
  console.log('\n✓ URLs saved to scripts/brand-asset-urls.json');

  // Auto-apply to index.html
  const indexFile = path.join(__dirname, '..', 'frontend', 'index.html');
  let html = fs.readFileSync(indexFile, 'utf8');

  html = html.replace(/<link rel="icon"[^>]*>/, `<link rel="icon" type="image/png" href="${logoUrl}" />`);
  html = html.replace(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${ogUrl}" />`);
  html = html.replace(/<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${ogUrl}" />`);

  fs.writeFileSync(indexFile, html, 'utf8');
  console.log('✓ frontend/index.html patched with Cloudinary URLs\n');

  console.log('  Next step — push to GitHub:');
  console.log('  git add -A && git commit -m "feat: brand assets via Cloudinary" && git push origin main\n');
}

main().catch(e => { console.error('\n✗', e.message); process.exit(1); });
