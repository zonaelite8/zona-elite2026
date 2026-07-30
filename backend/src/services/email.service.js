const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuración de Brevo API Key
const brevoApiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;

// Configuración de remitente por defecto
const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || 'zonaelite8@gmail.com';
const senderName = process.env.BREVO_SENDER_NAME || 'Zona Élite';

// Configuración de SMTP (Brevo SMTP relay o proveedor alternativo)
let nodemailerTransporter = null;
const smtpHost = process.env.EMAIL_HOST || 'smtp-relay.brevo.com';
const smtpPort = parseInt(process.env.EMAIL_PORT) || 587;
const smtpUser = process.env.BREVO_SMTP_USER || process.env.EMAIL_USER;
const smtpPass = process.env.BREVO_SMTP_PASS || process.env.EMAIL_PASS;

if (smtpUser && smtpPass) {
  nodemailerTransporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false, // 587 usa STARTTLS
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
}

/**
 * Función principal para enviar correos mediante Brevo (vía API REST v3 o SMTP Relay).
 * Se ejecuta de forma asíncrona y segura sin bloquear la aplicación.
 */
const sendEmail = async ({ to, subject, html, text, from }) => {
  const rawRecipients = Array.isArray(to) ? to : [to];
  const recipients = rawRecipients.map(email => ({ email: String(email).trim() }));

  console.log(`[Email Service Brevo] Intentando enviar correo "${subject}" a: ${rawRecipients.join(', ')}`);

  try {
    // 1. Enviar vía Brevo API REST v3 (Método nativo y recomendado por Brevo)
    if (brevoApiKey) {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': brevoApiKey
        },
        body: JSON.stringify({
          sender: { name: senderName, email: from || senderEmail },
          to: recipients,
          subject: subject,
          htmlContent: html || `<p>${text}</p>`
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error('[Email Service Brevo] Brevo API devolvió un error:', data);
        return { success: false, error: data.message || `HTTP ${response.status}` };
      }

      console.log(`[Email Service Brevo] Correo enviado exitosamente via Brevo API ID: ${data.messageId || 'OK'}`);
      return { success: true, messageId: data.messageId };
    }

    // 2. Fallback a Brevo SMTP Relay via Nodemailer
    if (nodemailerTransporter) {
      const info = await nodemailerTransporter.sendMail({
        from: `"${senderName}" <${from || senderEmail}>`,
        to: rawRecipients.join(', '),
        subject: subject,
        html: html || `<p>${text}</p>`,
        text: text || ''
      });

      console.log(`[Email Service Brevo] Correo enviado exitosamente via Brevo SMTP ID: ${info.messageId}`);
      return { success: true, id: info.messageId };
    }

    console.warn('[Email Service Brevo] No hay credenciales de Brevo configuradas (BREVO_API_KEY o EMAIL_USER/EMAIL_PASS).');
    return { success: false, reason: 'No transport configured' };
  } catch (error) {
    console.error('[Email Service Brevo] Error crítico al enviar correo:', error.message || error);
    return { success: false, error: error.message };
  }
};

/**
 * Enviar código de verificación de 6 dígitos al registrarse
 */
const sendVerificationEmail = async (userEmail, userName, code) => {
  const subject = 'Código de Verificación - Zona Élite';
  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0c0d10; color: #f4f4f5; padding: 40px 20px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
      <div style="text-align: center; border-bottom: 2px solid #f5b927; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #f5b927; margin: 0; font-size: 26px; letter-spacing: 2px; text-transform: uppercase;">ZONA ÉLITE</h1>
      </div>
      <h2 style="color: #ffffff; font-size: 20px; margin-top: 0; text-align: center;">¡Bienvenido, ${userName}!</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #a1a1aa; text-align: center;">Para activar tu cuenta y poder agendar tus entrenamientos, ingresa el siguiente código de 6 dígitos en la aplicación:</p>
      
      <div style="background:#18181b; border: 1px solid #27272a; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #f5b927; font-family: monospace;">${code}</span>
      </div>

      <p style="font-size: 13px; color: #71717a; text-align: center;">Este código es confidencial. Si no creaste una cuenta en Zona Élite, puedes ignorar este mensaje.</p>
      <p style="font-size: 12px; color: #71717a; text-align: center; margin-top: 40px; border-top: 1px solid #27272a; padding-top: 20px;">© ${new Date().getFullYear()} Zona Élite</p>
    </div>
  `;

  sendEmail({ to: userEmail, subject, html }).catch(err => {
    console.error('Error background verification email:', err);
  });
};

/**
 * Plantilla y envío de correo de bienvenida al registrarse (si no requiere verificación).
 */
const sendRegistrationEmail = async (userEmail, userName) => {
  const subject = '¡Bienvenido a Zona Élite!';
  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0c0d10; color: #f4f4f5; padding: 40px 20px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
      <div style="text-align: center; border-bottom: 2px solid #f5b927; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #f5b927; margin: 0; font-size: 26px; letter-spacing: 2px; text-transform: uppercase;">ZONA ÉLITE</h1>
      </div>
      <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">¡Hola, ${userName}!</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #a1a1aa;">Tu cuenta en <strong>Zona Élite</strong> se ha creado exitosamente. Ya puedes acceder a la plataforma y reservar tus clases.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'https://zonaelitemarinilla.com'}" style="background-color: #f5b927; color: #0c0d10; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Ir a Zona Élite</a>
      </div>
      <p style="font-size: 12px; color: #71717a; text-align: center; margin-top: 40px; border-top: 1px solid #27272a; padding-top: 20px;">© ${new Date().getFullYear()} Zona Élite • Todos los derechos reservados</p>
    </div>
  `;

  sendEmail({ to: userEmail, subject, html }).catch(err => {
    console.error('Error background registration email:', err);
  });
};

/**
 * Plantilla y envío de correo de confirmación de reserva.
 */
const sendBookingConfirmation = async (userEmail, userName, { modality, dateStr, timeStr, cancelToken }) => {
  const subject = `Confirmación de Reserva: ${modality} - ${dateStr}`;
  const cancelUrl = `${process.env.FRONTEND_URL || 'https://zonaelitemarinilla.com'}/cancelar?token=${cancelToken}`;

  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0c0d10; color: #f4f4f5; padding: 40px 20px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
      <div style="text-align: center; border-bottom: 2px solid #f5b927; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #f5b927; margin: 0; font-size: 26px; letter-spacing: 2px; text-transform: uppercase;">ZONA ÉLITE</h1>
      </div>
      <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">¡Reserva Confirmada!</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #a1a1aa;">Hola <strong>${userName}</strong>, tu clase ha sido agendada con éxito.</p>
      
      <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 10px; padding: 20px; margin: 25px 0;">
        <p style="margin: 8px 0; color: #d4d4d8;"><strong>Modalidad:</strong> <span style="color: #f5b927;">${modality}</span></p>
        <p style="margin: 8px 0; color: #d4d4d8;"><strong>Fecha:</strong> ${dateStr}</p>
        <p style="margin: 8px 0; color: #d4d4d8;"><strong>Hora:</strong> ${timeStr}</p>
      </div>

      ${cancelToken ? `
        <div style="text-align: center; margin-top: 30px;">
          <p style="font-size: 13px; color: #71717a; margin-bottom: 10px;">¿Necesitas cancelar tu reserva?</p>
          <a href="${cancelUrl}" style="color: #ef4444; border: 1px solid #ef4444; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: bold; display: inline-block;">Cancelar Reserva</a>
        </div>
      ` : ''}

      <p style="font-size: 12px; color: #71717a; text-align: center; margin-top: 40px; border-top: 1px solid #27272a; padding-top: 20px;">© ${new Date().getFullYear()} Zona Élite</p>
    </div>
  `;

  sendEmail({ to: userEmail, subject, html }).catch(err => {
    console.error('Error background booking email:', err);
  });
};

/**
 * Notificación al administrador sobre una nueva reserva.
 */
const sendAdminBookingNotification = async ({ userName, userEmail, modality, dateStr, timeStr }) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'zonaelite8@gmail.com';
  const subject = `[ADMIN] Nueva Reserva: ${userName} - ${dateStr}`;

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0c0d10; color: #f4f4f5; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; border: 1px solid #27272a;">
      <h2 style="color: #f5b927; margin-top: 0;">Nueva Reserva Registrada</h2>
      <p style="color: #d4d4d8;"><strong>Cliente:</strong> ${userName} (${userEmail})</p>
      <p style="color: #d4d4d8;"><strong>Modalidad:</strong> ${modality}</p>
      <p style="color: #d4d4d8;"><strong>Fecha y Hora:</strong> ${dateStr} a las ${timeStr}</p>
    </div>
  `;

  sendEmail({ to: adminEmail, subject, html }).catch(err => {
    console.error('Error background admin booking email:', err);
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendRegistrationEmail,
  sendBookingConfirmation,
  sendAdminBookingNotification
};
