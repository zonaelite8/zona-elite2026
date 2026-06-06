const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Enviar un correo electrónico via Resend API (funciona en Render)
 * @param {string} to - Destinatario
 * @param {string} subject - Asunto del correo
 * @param {string} text - Contenido en texto plano
 * @param {string} html - (Opcional) Contenido en formato HTML
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Zona Elite <onboarding@resend.dev>',
      to: [to],
      subject,
      text,
      html: html || text
    });

    if (error) {
      console.error(`Error al enviar correo a ${to}:`, error);
      return false;
    }

    console.log(`Correo enviado a ${to}: ${data.id}`);
    return true;
  } catch (error) {
    console.error(`Error al enviar correo a ${to}:`, error);
    return false;
  }
};

module.exports = {
  sendEmail
};
