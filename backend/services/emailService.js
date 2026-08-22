const nodemailer = require('nodemailer');

/**
 * Checks whether SMTP credentials are fully configured in the environment.
 */
function isEmailConfigured() {
  const hasServiceAuth = Boolean(process.env.SMTP_SERVICE && process.env.SMTP_USER && process.env.SMTP_PASS);
  const hasHostAuth = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  return hasServiceAuth || hasHostAuth;
}

/**
 * Creates and returns a Nodemailer transporter if configured, or null otherwise.
 */
function createTransporter() {
  if (!isEmailConfigured()) {
    return null;
  }

  if (process.env.SMTP_SERVICE) {
    return nodemailer.createTransport({
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: isSecure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const getFromAddress = () => {
  return process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@realestateai.local';
};

/**
 * Sends an email verification link to the newly registered user.
 */
async function sendVerificationEmail({ email, name, token }) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const link = `${appUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const transporter = createTransporter();

  if (!transporter) {
    console.log('\n========================================');
    console.log(`[email] (Dev Mode - SMTP not configured)`);
    console.log(`Verify ${email}:\n${link}`);
    console.log('========================================\n');
    return { sent: false, devMode: true };
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #e2e8f0; margin: 0; padding: 24px; }
        .card { max-width: 520px; margin: 0 auto; background-color: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .logo { font-size: 20px; font-weight: 700; color: #3b82f6; margin-bottom: 20px; }
        h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px; }
        p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px; }
        .btn-container { margin: 28px 0; text-align: center; }
        .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 10px; }
        .footer { font-size: 12px; color: #64748b; margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 16px; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">🏢 Real Estate AI Platform</div>
        <h1>Verify Your Email Address</h1>
        <p>Hello ${name ? name : 'there'},</p>
        <p>Thank you for signing up. Please confirm your email address by clicking the button below to activate your account:</p>
        <div class="btn-container">
          <a href="${link}" class="btn" target="_blank">Verify Email</a>
        </div>
        <p>This verification link will expire in 24 hours.</p>
        <div class="footer">
          If the button above does not work, copy and paste this link into your browser:<br>
          <a href="${link}" style="color: #38bdf8;">${link}</a>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Verify your Real Estate AI Platform account: ${link}\nThis link expires in 24 hours.`;

  try {
    await transporter.sendMail({
      from: `"Real Estate AI" <${getFromAddress()}>`,
      to: email,
      subject: 'Verify your Real Estate AI account',
      text,
      html,
    });
    console.log(`[email] Verification email successfully sent to ${email}`);
    return { sent: true, devMode: false };
  } catch (error) {
    console.error(`[email] Failed to send verification email to ${email}:`, error.message);
    console.log(`[email fallback link] ${link}`);
    return { sent: false, devMode: true, error: error.message };
  }
}

/**
 * Sends a password reset link to the user's email.
 */
async function sendPasswordResetEmail({ email, token }) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const link = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const transporter = createTransporter();

  if (!transporter) {
    console.log('\n========================================');
    console.log(`[email] (Dev Mode - SMTP not configured)`);
    console.log(`Password reset for ${email}:\n${link}`);
    console.log('========================================\n');
    return { sent: false, devMode: true };
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #e2e8f0; margin: 0; padding: 24px; }
        .card { max-width: 520px; margin: 0 auto; background-color: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .logo { font-size: 20px; font-weight: 700; color: #3b82f6; margin-bottom: 20px; }
        h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px; }
        p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px; }
        .btn-container { margin: 28px 0; text-align: center; }
        .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 600; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 10px; }
        .footer { font-size: 12px; color: #64748b; margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 16px; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">🏢 Real Estate AI Platform</div>
        <h1>Reset Your Password</h1>
        <p>We received a request to reset your password. Click the button below to choose a new password:</p>
        <div class="btn-container">
          <a href="${link}" class="btn" target="_blank">Reset Password</a>
        </div>
        <p>This password reset link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
        <div class="footer">
          If the button above does not work, copy and paste this link into your browser:<br>
          <a href="${link}" style="color: #38bdf8;">${link}</a>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Reset your Real Estate AI Platform password: ${link}\nThis link expires in 1 hour. If you did not request this, ignore this email.`;

  try {
    await transporter.sendMail({
      from: `"Real Estate AI" <${getFromAddress()}>`,
      to: email,
      subject: 'Reset your Real Estate AI password',
      text,
      html,
    });
    console.log(`[email] Password reset email successfully sent to ${email}`);
    return { sent: true, devMode: false };
  } catch (error) {
    console.error(`[email] Failed to send password reset email to ${email}:`, error.message);
    console.log(`[email fallback link] ${link}`);
    return { sent: false, devMode: true, error: error.message };
  }
}

module.exports = {
  isEmailConfigured,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
