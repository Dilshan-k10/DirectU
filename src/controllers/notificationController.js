import { sendWelcomeEmail, sendApplicationSubmissionEmail, sendExamSubmissionEmail } from '../services/mailService.js';
import { processIntakeResults } from '../services/intakeResultService.js';

export const sendWelcomeEmailController = async (req, res) => {
  const { email, name } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'email is required' });
  }

  try {
    await sendWelcomeEmail(email, name || 'User');
    return res.status(200).json({
      status: 'success',
      message: 'Welcome email sent successfully',
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return res.status(500).json({
      error: 'Failed to send welcome email',
      message: error.message,
    });
  }
};

export const sendApplicationSubmissionEmailController = async (req, res) => {
  const { email, programName } = req.body || {};

  if (!email || !programName) {
    return res.status(400).json({ error: 'email and programName are required' });
  }

  try {
    await sendApplicationSubmissionEmail(email, programName);
    return res.status(200).json({
      status: 'success',
      message: 'Application submission email sent successfully',
    });
  } catch (error) {
    console.error('Failed to send application submission email:', error);
    return res.status(500).json({
      error: 'Failed to send application submission email',
      message: error.message,
    });
  }
};

export const sendExamSubmissionEmailController = async (req, res) => {
  const { email, score } = req.body || {};

  if (!email || score === undefined || score === null) {
    return res.status(400).json({ error: 'email and score are required' });
  }

  try {
    await sendExamSubmissionEmail(email, score);
    return res.status(200).json({
      status: 'success',
      message: 'Exam submission email sent successfully',
    });
  } catch (error) {
    console.error('Failed to send exam submission email:', error);
    return res.status(500).json({
      error: 'Failed to send exam submission email',
      message: error.message,
    });
  }
};

export const processIntakeResultsEmailController = async (req, res) => {
  const { intakeId } = req.params;

  if (!intakeId) {
    return res.status(400).json({ error: 'intakeId is required' });
  }

  try {
    await processIntakeResults(intakeId);
    return res.status(200).json({
      status: 'success',
      message: 'Intake results processed and selection emails sent successfully',
    });
  } catch (error) {
    console.error('Failed to process intake results emails:', error);
    return res.status(500).json({
      error: 'Failed to process intake results emails',
      message: error.message,
    });
  }
};

