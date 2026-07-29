const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER || 'zonaelite8@gmail.com';
const emailPass = process.env.EMAIL_PASS;

let transporter = null;

if (emailUser && emailPass) {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: emailUser,
      pass: emailPass
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
  console.log(`[Email Service] Nodemailer configured for: ${emailUser}`);
} else {
  console.warn('[Email Service] No EMAIL_PASS set — emails will be skipped');
}

/**
 * Enviar un correo electrónico via Nodemailer (Gmail SMTP)
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    if (!transporter) {
      console.warn(`[Email Service] No transporter configured. Skipping email to ${to}`);
      return false;
    }

    await transporter.sendMail({
      from: `"Zona Elite" <${emailUser}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || text
    });

    console.log(`[Email Service] Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`[Email Service] Error sending email to ${to}:`, error.message);
    return false;
  }
};

module.exports = { sendEmail };
