require('dotenv').config();
const nodemailer = require('nodemailer');

async function main() {
    console.log('Testing SMTP connection...');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('User:', process.env.SMTP_USER);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT, // Ensure this is number if needed, but string usually works
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('✅ Connection verified successfully');

        console.log('Attempting to send email...');
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: '233000@students.au.edu.pk',
            subject: 'SMTP Test',
            text: 'If you receive this, SMTP is working.',
        });
        console.log('✅ Email sent:', info.messageId);
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

main();
