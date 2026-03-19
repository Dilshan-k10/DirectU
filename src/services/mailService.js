import nodemailer from 'nodemailer';

function resolveEmailAuth() {
  const user =
    process.env.EMAIL_USER ||
    process.env.MAIL_USER ||
    process.env.SMTP_USER ||
    process.env.GMAIL_USER;

  const pass =
    process.env.EMAIL_APP_PASSWORD ||
    process.env.EMAIL_PASS ||
    process.env.EMAIL_PASSWORD ||
    process.env.MAIL_PASS ||
    process.env.SMTP_PASS ||
    process.env.GMAIL_APP_PASSWORD ||
    process.env.GMAIL_APP_PASSWORD;

  return { user, pass };
}

let transporterPromise = null;

async function getTransporter() {
  const { user, pass } = resolveEmailAuth();
  const safeUser = typeof user === 'string' ? user.trim() : '';
  const safePass = typeof pass === 'string' ? pass.trim() : '';

  if (!safeUser || !safePass) {
    console.warn(
      '[mailService] Email credentials missing. Set EMAIL_USER and EMAIL_APP_PASSWORD in .env (or EMAIL_PASS as fallback).'
    );
    return null;
  }

  if (!transporterPromise) {
    transporterPromise = (async () => {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: safeUser, pass: safePass },
        tls: {
          rejectUnauthorized: false,
        },
      });

      try {
        await transporter.verify();
        console.log('[mailService] Mail transporter verified.');
      } catch (err) {
        console.error('[mailService] Mail transporter verification failed:', err);
      }

      return transporter;
    })();
  }

  return transporterPromise;
}

export const sendEmail = async (to, subject, message) => {
  try {
    const transporter = await getTransporter();
    if (!transporter) return;

    const { user } = resolveEmailAuth();
    const safeUser = typeof user === 'string' ? user.trim() : '';

    await transporter.sendMail({
      from: `"DirectU" <${safeUser || 'no-reply@directu.local'}>`,
      to,
      subject,
      text: message,
    });

    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    throw error;
  }
};

export const sendWelcomeEmail = async (email, name) => {
  const subject = 'Welcome to DirectU';
  const message = `Welcome to DirectU.

Your account has been successfully created.
You can now submit your application.

DirectU Team`;

  await sendEmail(email, subject, message);
};

export const sendApplicationSubmissionEmail = async (email, programName) => {
  const subject = 'Application Submitted - DirectU';
  const message = `Your application for ${programName} has been submitted successfully.

You will receive further instructions regarding the entrance examination.

DirectU`;

  await sendEmail(email, subject, message);
};

export const sendExamSubmissionEmail = async (email, score) => {
  const subject = 'Exam Submitted - DirectU';
  const message = `Your exam has been submitted successfully.

Score: ${score}

Please wait for further communication from the university regarding the final results.

DirectU`;

  await sendEmail(email, subject, message);
};

export const sendFinalSelectionEmail = async (email, selected) => {
  const subject = 'Intake Result - DirectU';

  const message = selected
    ? `Congratulations! You have been selected for the program.
Further instructions will be provided by the university.`
    : `Thank you for applying.

Unfortunately you were not selected for this intake. We encourage you to apply again in the future.`;

  await sendEmail(email, subject, message);
};

