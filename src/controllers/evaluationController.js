import { prisma } from '../config/db.js';

// Get evaluation result for a specific application
const getEvaluation = async (req, res) => {
    const { applicationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // Fetch application with related data
        const application = await prisma.applications.findUnique({
            where: { id: parseInt(applicationId) },
            include: {
                cv_analysis_results: true,
                candidate_feedback: true,
                alternative_programs: {
                    include: {
                        degrees: true
                    }
                },
                degrees: true,
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        if (!application) {
            return res.status(404).json({ error: "Application not found !" });
        }

        // Authorization: Candidate can only access their own application
        if (userRole !== 'ADMIN' && application.user_id !== userId) {
            return res.status(403).json({ error: "Access denied" });
        }

        res.status(200).json({
            status: "success",
            data: application
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve evaluation", details: error.message });
    }
};

// Allow candidate to reconsider application (switch or continue)
const reconsiderApplication = async (req, res) => {
    const { applicationId } = req.params;
    const { action } = req.body; // "switch" or "continue"
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        // Fetch application
        const application = await prisma.applications.findUnique({
            where: { id: parseInt(applicationId) },
            include: {
                alternative_programs: true
            }
        });

        if (!application) {
            return res.status(404).json({ error: "Application not found" });
        }

        // Authorization: Only candidate can reconsider their own application
        if (application.user_id !== userId) {
            return res.status(403).json({ error: "Access denied" });
        }

        // Check if reconsideration is locked
        if (application.reconsideration_locked) {
            return res.status(400).json({ error: "Reconsideration already used" });
        }

        // Validate action
        if (!action || (action !== "switch" && action !== "continue")) {
            return res.status(400).json({ error: "Invalid action. Use 'switch' or 'continue'" });
        }

        // Check if alternative program exists
        if (!application.alternative_programs) {
            return res.status(400).json({ error: "No alternative program suggested" });
        }

        let updatedApplication;

        if (action === "switch") {
            // Switch to suggested program
            updatedApplication = await prisma.applications.update({
                where: { id: parseInt(applicationId) },
                data: {
                    degree_id: application.alternative_programs.suggested_program_id,
                    reconsideration_locked: true
                },
                include: {
                    degrees: true
                }
            });
        } else {
            // Continue with original program
            updatedApplication = await prisma.applications.update({
                where: { id: parseInt(applicationId) },
                data: {
                    reconsideration_locked: true
                },
                include: {
                    degrees: true
                }
            });
        }

        res.status(200).json({
            status: "success",
            message: action === "switch" ? "Switched to suggested program" : "Continuing with original program",
            data: updatedApplication
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to process reconsideration", details: error.message });
    }
};

// Admin: Suggest or update alternative degree program
const suggestAlternative = async (req, res) => {
    const { applicationId } = req.params;
    const { suggested_program_id, reason } = req.body;
    const userRole = req.user.role;

    try {
        // Authorization: Only admin can suggest alternatives
        if (userRole !== 'ADMIN') {
            return res.status(403).json({ error: "Access denied. Admin only" });
        }

        // Validate application exists
        const application = await prisma.applications.findUnique({
            where: { id: parseInt(applicationId) }
        });

        if (!application) {
            return res.status(404).json({ error: "Application not found" });
        }

        // Validate suggested program exists
        const suggestedDegree = await prisma.degrees.findUnique({
            where: { id: parseInt(suggested_program_id) }
        });

        if (!suggestedDegree) {
            return res.status(404).json({ error: "Suggested degree program not found" });
        }

        // Check if alternative already exists
        const existingAlternative = await prisma.alternative_programs.findUnique({
            where: { application_id: parseInt(applicationId) }
        });

        let alternative;

        if (existingAlternative) {
            // Update existing alternative
            alternative = await prisma.alternative_programs.update({
                where: { application_id: parseInt(applicationId) },
                data: {
                    suggested_program_id: parseInt(suggested_program_id),
                    reason: reason || null
                },
                include: {
                    degrees: true
                }
            });
        } else {
            // Create new alternative
            alternative = await prisma.alternative_programs.create({
                data: {
                    application_id: parseInt(applicationId),
                    suggested_program_id: parseInt(suggested_program_id),
                    reason: reason || null
                },
                include: {
                    degrees: true
                }
            });
        }

        res.status(200).json({
            status: "success",
            message: existingAlternative ? "Alternative program updated" : "Alternative program suggested",
            data: alternative
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to suggest alternative", details: error.message });
    }
};

export { getEvaluation, reconsiderApplication, suggestAlternative };
