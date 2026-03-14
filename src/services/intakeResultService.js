import { prisma } from '../config/db.js';
import { sendFinalSelectionEmail } from './mailService.js';

export const processIntakeResults = async (intakeId) => {
  if (!intakeId) {
    throw new Error('intakeId is required');
  }

  const rankings = await prisma.ranking.findMany({
    where: { intakeId },
    orderBy: { rank: 'asc' },
    include: {
      application: {
        select: {
          id: true,
          program: {
            select: {
              id: true,
              name: true,
            },
          },
          candidate: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!rankings || rankings.length === 0) {
    console.log(`No rankings found for intake ${intakeId}.`);
    return;
  }

  console.log(
    `Processing intake results for intake ${intakeId}. Total ranked applications: ${rankings.length}`
  );

  const operations = [];

  for (const ranking of rankings) {
    const isSelected = ranking.rank <= 100;
    const email = ranking.application.candidate.email;

    if (!email) {
      console.warn(
        `Skipping email for application ${ranking.application.id} - candidate has no email.`
      );
    } else {
      operations.push(
        (async () => {
          try {
            await sendFinalSelectionEmail(email, isSelected);
          } catch (error) {
            console.error(
              `Failed to send final selection email for application ${ranking.application.id}:`,
              error
            );
          }
        })()
      );
    }

    operations.push(
      prisma.ranking.update({
        where: { applicationId: ranking.application.id },
        data: {
          status: isSelected ? 'accepted' : 'rejected',
        },
      })
    );
  }

  await Promise.all(operations);

  console.log(
    `Finished processing intake results for intake ${intakeId}. Emails dispatched and rankings updated.`
  );
};

