import { prisma } from '../config/db.js';

/**
 * Recalculate and persist rankings for a degree.
 *
 * Ranking rules:
 * - Sort by obtainedMarks DESC
 * - Assign sequential rank starting from 1
 * - Store in existing Ranking table (upsert by applicationId)
 *
 * This function does NOT throw on "no results"; it simply results in no writes.
 */
export async function updateDegreeRanking(degreeId) {
  if (!degreeId) {
    throw new Error('degreeId is required');
  }

  const results = await prisma.testResult.findMany({
    where: {
      status: 'completed',
      obtainedMarks: { not: null },
      application: {
        programId: degreeId,
      },
    },
    select: {
      obtainedMarks: true,
      application: {
        select: {
          id: true,
          programId: true,
          intakeId: true,
        },
      },
    },
  });

  if (!results || results.length === 0) return;

  const sorted = results
    .map((r) => ({
      applicationId: r.application.id,
      degreeId: r.application.programId,
      intakeId: r.application.intakeId,
      marks: typeof r.obtainedMarks === 'number' ? r.obtainedMarks : 0,
    }))
    .sort((a, b) => {
      if (b.marks !== a.marks) return b.marks - a.marks;
      return String(a.applicationId).localeCompare(String(b.applicationId));
    });

  const ops = sorted.map((row, idx) =>
    prisma.ranking.upsert({
      where: { applicationId: row.applicationId },
      update: { rank: idx + 1 },
      create: {
        applicationId: row.applicationId,
        degreeId: row.degreeId,
        intakeId: row.intakeId,
        rank: idx + 1,
      },
      select: { applicationId: true },
    })
  );

  await prisma.$transaction(ops);
}

