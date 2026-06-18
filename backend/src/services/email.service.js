const nodemailer = require('nodemailer');
const { Resend } = require('resend');
require('dotenv').config();

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const resendApiKey = process.env.RESEND_API_KEY;

let transporter = null;
let resend = null;
let activeUser = '';

if (emailUser && emailPass) {
  activeUser = emailUser;
  const isGmail = emailUser.toLowerCase().endsWith('@gmail.com');
  const transportConfig = isGmail 
    ? {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        requireTLS: true,
        auth: {
          user: emailUser,
          pass: emailPass
        },
        connectionTimeout: 10000, // 10 segundos max
        greetingTimeout: 10000,
        socketTimeout: 15000
      }
    : {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 465,
        secure: process.env.EMAIL_SECURE !== 'false',
        auth: {
          user: emailUser,
          pass: emailPass
        }
      };
      
  console.log(`[Email Service] Configuring transport via Nodemailer (${isGmail ? 'Gmail' : 'SMTP'}) for user: ${emailUser}`);
  transporter = nodemailer.createTransport(transportConfig);
} else if (resendApiKey) {
  console.log('[Email Service] Configuring transport via Resend API');
  resend = new Resend(resendApiKey);
} else {
  activeUser = 'zonaelite8@gmail.com';
  console.log('[Email Service] No credentials in env. Using default Gmail fallback configuration.');
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: 'zonaelite8@gmail.com',
      pass: 'bbiljzqpincehysh'
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
}

/**
 * Enviar un correo electrónico via Nodemailer (Gmail/SMTP) o Resend API
 * @param {string} to - Destinatario
 * @param {string} subject - Asunto del correo
 * @param {string} text - Contenido en texto plano
 * @param {string} html - (Opcional) Contenido en formato HTML
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    if (transporter) {
      const mailOptions = {
        from: `"Zona Élite" <${activeUser}>`,
        to,
        subject,
        text,
        html: html || text
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log(`[Email Service] Correo enviado a ${to} via Nodemailer: ${info.messageId}`);
      return true;
    } else if (resend) {
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Zona Elite <info@zonaelitemarinilla.com>',
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        html: html || text
      });

      if (error) {
        console.error(`[Email Service] Error al enviar correo via Resend a ${to}:`, error);
        return false;
      }

      console.log(`[Email Service] Correo enviado a ${to} via Resend: ${data.id}`);
      return true;
    } else {
      console.warn(`[Email Service] Ningún transporte configurado. Saltando envío a ${to}`);
      return false;
    }
  } catch (error) {
    console.error(`[Email Service] Error al enviar correo a ${to}:`, error);
    return false;
  }
};

module.exports = {
  sendEmail
};

