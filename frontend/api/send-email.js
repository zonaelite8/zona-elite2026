import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { to, subject, html } = req.body;
  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Faltan parámetros' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER || 'zonaelite8@gmail.com',
        pass: process.env.EMAIL_PASS || 'bbiljzqpincehysh'
      }
    });

    await transporter.sendMail({
      from: '"Zona Elite" <zonaelite8@gmail.com>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Vercel Email Error:', error);
    return res.status(500).json({ success: false, error: error.message || String(error) });
  }
}
