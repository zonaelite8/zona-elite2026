const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function testExternalEmail() {
  console.log("Intentando enviar a un correo de usuario externo...");
  try {
    const { data, error } = await resend.emails.send({
      from: 'Zona Elite <info@zonaelite.com>', // Este es el que pusimos en el código
      to: ['test_usuario_externo@hotmail.com'], // Un correo cualquiera
      subject: 'Prueba de usuario',
      text: 'Este correo debería fallar si el dominio no está verificado.'
    });

    if (error) {
      console.error("\n❌ ERROR DE RESEND:");
      console.error(error.message);
    } else {
      console.log("\n✅ ÉXITO:", data);
    }
  } catch (err) {
    console.error("Excepción:", err);
  }
}

testExternalEmail();
