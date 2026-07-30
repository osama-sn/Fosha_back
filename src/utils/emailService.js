const nodemailer = require('nodemailer');

const sendOTPEmail = async (email, otp) => {
  // If SMTP isn't fully configured in .env, we log the OTP for local dev/testing
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log(`\n========================================`);
    console.log(`📧 [DEV EMAIL SERVICE] OTP for ${email}: ${otp}`);
    console.log(`========================================\n`);
    return true;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"Rahala Support" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Password Reset OTP - Rahala',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>Your OTP code to reset your password is:</p>
        <h1 style="color: #007bff; letter-spacing: 4px;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  return true;
};

module.exports = {
  sendOTPEmail,
};
