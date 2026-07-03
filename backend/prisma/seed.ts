import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminHash = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ncole.rw' },
    update: {},
    create: {
      email: 'admin@ncole.rw',
      name: 'Ncole Admin',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // Root categories
  const categories = [
    { name: 'Printing Services', slug: 'printing-services', sortOrder: 1 },
    { name: 'Branding & Signage', slug: 'branding-signage', sortOrder: 2 },
    { name: 'Graphic Design', slug: 'graphic-design', sortOrder: 3 },
    { name: 'Custom Apparel', slug: 'custom-apparel', sortOrder: 4 },
    { name: 'Packaging', slug: 'packaging', sortOrder: 5 },
    { name: 'Office Supplies', slug: 'office-supplies', sortOrder: 6 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ ${categories.length} categories seeded`);

  console.log('✅ Seeding complete');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
