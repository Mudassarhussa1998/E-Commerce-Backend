/**
 * Direct SMTP Test - sends email without needing a user in DB
 */
require('dotenv').config();
const nodemailer = require('nodemailer');

const TEST_EMAIL = process.env.TEST_EMAIL || 'nnowor57@gmail.com';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM;

async function testSmtp() {
  console.log('🧪 Direct SMTP Email Test\n');
  console.log(`📤 SMTP User: ${SMTP_USER}`);
  console.log(`📤 From: ${EMAIL_FROM}\n`);

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  console.log(`📧 Sending test email to: ${TEST_EMAIL}`);

  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: TEST_EMAIL,
      subject: 'StyleHub - SMTP Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #B88E2F;">SMTP Test Successful! ✅</h1>
          <p>If you're reading this, Gmail SMTP is working correctly.</p>
          <p>Test OTP: <strong>123456</strong></p>
          <p>Sent at: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    console.log(`✅ Email sent successfully!`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`\n📬 Check ${TEST_EMAIL} inbox (or spam folder)`);
  } catch (error) {
    console.log(`❌ Failed to send email:`, error.message);
  }
}

testSmtp();
