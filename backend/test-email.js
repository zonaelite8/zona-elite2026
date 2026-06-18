const nodemailer = require('nodemailer');
async function test() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: 'zonaelite8@gmail.com',
      pass: 'bbiljzqpincehysh'
    }
  });
  try {
    await transporter.verify();
    console.log('Credentials OK!');
  } catch (err) {
    console.log('Error:', err.message);
  }
}
test();
