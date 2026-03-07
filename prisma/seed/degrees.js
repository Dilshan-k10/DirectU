import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@system';

const degrees = [
  {
    id: 'deg_cs_001',
    name: 'Computer Science',
    description:
      'Focuses on algorithms, artificial intelligence, software systems, and computational theory. Students learn programming, machine learning, and system architecture.',
    level: 'BACHELOR',
    duration: 4,
    capacity: 100,
    isActive: true,
  },
  {
    id: 'deg_se_001',
    name: 'Software Engineering',
    description:
      'Focuses on designing, developing, testing, and maintaining large software systems using modern engineering practices and development frameworks.',
    level: 'BACHELOR',
    duration: 4,
    capacity: 100,
    isActive: true,
  },
  {
    id: 'deg_bis_001',
    name: 'Business Information Systems',
    description:
      'Combines business management knowledge with information technology to improve organizational processes, enterprise systems, and digital transformation.',
    level: 'BACHELOR',
    duration: 4,
    capacity: 100,
    isActive: true,
  },
  {
    id: 'deg_bda_001',
    name: 'Business Data Analytics',
    description:
      'Focuses on analyzing business data using statistical techniques, machine learning, and visualization tools to support strategic decision making.',
    level: 'BACHELOR',
    duration: 4,
    capacity: 100,
    isActive: true,
  },
];

async function ensureAdminUser() {
  let admin = await prisma.user.findFirst({
    where: { email: ADMIN_EMAIL },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: 'System Admin',
        // This is demo data; replace with a secure hash in production.
        password: 'changeme',
        role: 'ADMIN',
      },
    });
  }

  return admin;
}

async function seedDegrees() {
  const admin = await ensureAdminUser();

  for (const degree of degrees) {
    await prisma.degree.upsert({
      where: { id: degree.id },
      update: {},
      create: {
        ...degree,
        createdBy: admin.id,
      },
    });
  }
}

async function main() {
  try {
    await seedDegrees();
    console.log('Degree seed data inserted successfully.');
  } catch (error) {
    console.error('Error seeding degrees:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();

