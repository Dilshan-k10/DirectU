import { prisma } from '../config/db.js';

const assertCanAccessApplication = (application, req) => {
  const userId = req.user?.id;
  const userRole = req.user?.role;

  if (!userId) return { ok: false, status: 401, error: 'Not authenticated' };
  if (userRole === 'ADMIN') return { ok: true };

  if (application.candidateId !== userId) {
    return { ok: false, status: 403, error: 'Access denied' };
  }

  return { ok: true };
};

// Get qualification status from CandidateFeedback + suggested alternative degrees (AlternativeProgram)
const getQualificationStatus = async (req, res) => {
  const { applicationId } = req.params;

  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        candidateId: true,
        programId: true,
        status: true,
        reconsiderationLocked: true,
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const access = assertCanAccessApplication(application, req);
    if (!access.ok) return res.status(access.status).json({ error: access.error });

    const latestFeedback = await prisma.candidateFeedback.findFirst({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        feedbackType: true,
        message: true,
        createdAt: true,
        alternativePrograms: {
          select: {
            id: true,
            programId: true,
            reason: true,
            matchScore: true,
            program: {
              select: {
                id: true,
                name: true,
                level: true,
                duration: true,
                capacity: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    const cvAnalysisResult = await prisma.cVAnalysisResult.findFirst({
      where: { applicationId },
      orderBy: { analyzedAt: 'desc' },
      select: {
        confidenceScore: true,
        analyzedAt: true,
      },
    });

    return res.status(200).json({
      status: 'success',
      data: {
        application: {
          id: application.id,
          programId: application.programId,
          status: application.status,
          reconsiderationLocked: application.reconsiderationLocked,
        },
        qualification: latestFeedback
          ? {
              feedbackId: latestFeedback.id,
              feedbackType: latestFeedback.feedbackType,
              message: latestFeedback.message,
              createdAt: latestFeedback.createdAt,
              confidenceScore: cvAnalysisResult?.confidenceScore ?? null,
              analyzedAt: cvAnalysisResult?.analyzedAt ?? null,
            }
          : null,
        alternatives: latestFeedback?.alternativePrograms ?? [],
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'Failed to retrieve qualification status', details: error.message });
  }
};

// Update Application.programId when user selects an alternative program
// Body: { programId: "<degree_uuid>" }
const selectAlternativeProgram = async (req, res) => {
  const { applicationId } = req.params;
  const { programId } = req.body;

  if (!programId) {
    return res.status(400).json({ error: 'programId is required' });
  }

  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        candidateId: true,
        programId: true,
        reconsiderationLocked: true,
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const access = assertCanAccessApplication(application, req);
    if (!access.ok) return res.status(access.status).json({ error: access.error });

    if (application.reconsiderationLocked) {
      return res.status(400).json({ error: 'Alternative selection already used' });
    }

    const latestFeedback = await prisma.candidateFeedback.findFirst({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        alternativePrograms: {
          select: { programId: true },
        },
      },
    });

    if (!latestFeedback) {
      return res.status(400).json({ error: 'No feedback found for this application' });
    }

    const allowedProgramIds = new Set(
      (latestFeedback.alternativePrograms ?? []).map((p) => p.programId)
    );

    if (!allowedProgramIds.has(programId)) {
      return res.status(400).json({ error: 'Selected program is not an allowed alternative' });
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        programId,
        reconsiderationLocked: true,
      },
      select: {
        id: true,
        programId: true,
        reconsiderationLocked: true,
        status: true,
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Application program updated successfully',
      data: updated,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'Failed to select alternative program', details: error.message });
  }
};

export { getQualificationStatus, selectAlternativeProgram };
