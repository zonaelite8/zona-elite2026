const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'zonaelite8@gmail.com',
    pass: 'bbiljzqpincehysh' // App password
  }
});

async function testEmail() {
  console.log("Intentando enviar correo...");
  try {
    const info = await transporter.sendMail({
      from: '"Zona Elite" <zonaelite8@gmail.com>',
      to: 'zonaelite8@gmail.com', // Enviarse a sí mismo para probar
      subject: 'Prueba de Sistema Zona Elite',
      text: 'Este es un correo de prueba.'
    });
    console.log("ÉXITO: Correo enviado.", info.messageId);
  } catch (error) {
    console.error("ERROR AL ENVIAR CORREO:");
    console.error(error);
  }
}

testEmail();
