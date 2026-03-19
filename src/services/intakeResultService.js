import { prisma } from '../config/db.js';
import { sendEmail } from './mailService.js';

export const processIntakeResults = async (intakeId) => {
  if (!intakeId) {
    throw new Error('intakeId is required');
  }

  // Dynamic ranking (no ranking persistence): per degree, sort by obtainedMarks DESC and notify candidates.
  const rows = await prisma.application.findMany({
    where: {
      intakeId,
      testResult: {
        status: 'completed',
        obtainedMarks: { not: null },
      },
    },
    select: {
      id: true,
      program: { select: { id: true, name: true } },
      candidate: { select: { email: true } },
      testResult: { select: { obtainedMarks: true } },
    },
  });

  if (!rows || rows.length === 0) {
    console.log(`No completed exam results found for intake ${intakeId}.`);
    return;
  }

  const byDegree = new Map();
  for (const r of rows) {
    const degreeId = r.program?.id;
    if (!degreeId) continue;
    if (!byDegree.has(degreeId)) byDegree.set(degreeId, []);
    byDegree.get(degreeId).push(r);
  }

  const emailOps = [];

  for (const [, apps] of byDegree.entries()) {
    const degreeName = apps[0]?.program?.name || 'your selected degree';

    const ranked = apps
      .map((a) => ({
        applicationId: a.id,
        email: a.candidate?.email || null,
        marks: typeof a.testResult?.obtainedMarks === 'number' ? a.testResult.obtainedMarks : 0,
      }))
      .sort((a, b) => {
        if (b.marks !== a.marks) return b.marks - a.marks;
        return String(a.applicationId).localeCompare(String(b.applicationId));
      });

    for (let idx = 0; idx < ranked.length; idx++) {
      const entry = ranked[idx];
      const email = entry.email;
      if (!email) continue;

      const isTopTwo = idx < 2;
      const subject = isTopTwo ? 'Congratulations!' : 'Application Update';
      const message = isTopTwo
        ? `Congratulations! You have been selected for ${degreeName}. Please wait for further details from the university.`
        : `We are sorry, you were not selected for ${degreeName}. Start a new journey with DirectU and explore new opportunities.`;

      emailOps.push(
        (async () => {
          try {
            await sendEmail(email, subject, message);
          } catch (err) {
            console.error(
              `Failed to send intake result email for application ${entry.applicationId}:`,
              err
            );
          }
        })()
      );
    }
  }

  await Promise.all(emailOps);

  console.log(
    `Finished processing intake results for intake ${intakeId}. Selection emails dispatched.`
  );
};

