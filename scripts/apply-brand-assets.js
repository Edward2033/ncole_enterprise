/**
 * N_COLE Brand Asset Applier
 * Reads brand-asset-urls.json and patches frontend/index.html with real Cloudinary URLs.
 * Run AFTER upload-brand-assets.js:  node scripts/apply-brand-assets.js
 */

const fs   = require('fs');
const path = require('path');

const urlsFile   = path.join(__dirname, 'brand-asset-urls.json');
const indexFile  = path.join(__dirname, '..', 'frontend', 'index.html');

if (!fs.existsSync(urlsFile)) {
  console.error('✗ brand-asset-urls.json not found. Run upload-brand-assets.js first.');
  process.exit(1);
}

const { logoUrl, ogUrl } = JSON.parse(fs.readFileSync(urlsFile, 'utf8'));

console.log('\nApplying brand assets to frontend/index.html...');
console.log('  Logo URL :', logoUrl);
console.log('  OG URL   :', ogUrl);

let html = fs.readFileSync(indexFile, 'utf8');

// Replace favicon
html = html.replace(
  /<link rel="icon"[^>]*>/,
  `<link rel="icon" type="image/png" href="${logoUrl}" />`
);

// Replace og:image
html = html.replace(
  /<meta property="og:image"[^>]*>/,
  `<meta property="og:image" content="${ogUrl}" />`
);

// Replace twitter:image
html = html.replace(
  /<meta name="twitter:image"[^>]*>/,
  `<meta name="twitter:image" content="${ogUrl}" />`
);

fs.writeFileSync(indexFile, html, 'utf8');

console.log('\n✓ frontend/index.html updated successfully.');
console.log('  Now run:  git add -A && git commit -m "feat: add brand assets via Cloudinary" && git push origin main\n');
