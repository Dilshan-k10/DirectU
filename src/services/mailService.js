import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // allow self‑signed / intercepted certs
  },
});

export const sendEmail = async (to, subject, message) => {
  try {
    await transporter.sendMail({
      from: `"DirectU" <${process.env.EMAIL_USER}>`,
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

