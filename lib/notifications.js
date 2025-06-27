// lib/utils/sendEmail.js
import nodemailer from 'nodemailer';

export async function sendEmail(to, subject, text) {
  try {
    // Set up the transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_GMAIL_USER,
        pass: process.env.SMTP_GMAIL_PASS,
      },
    });

    // Email options
    const mailOptions = {
      from: `"Alert System" <${process.env.APP_NAME}>`,
      to,
      subject,
      text,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return info;
  } catch (error) {
    console.error('Failed to send email:', error.message);
    throw new Error('Email delivery failed');
  }
}


export const sendSms = async (phone, message) => {
    console.log(`📲 [Mock SMS] Sending to ${phone}: ${message}`);
};


