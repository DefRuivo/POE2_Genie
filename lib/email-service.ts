import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.resend.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'resend',
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendKitchenJoinRequestEmail(
  adminEmail: string,
  requesterName: string,
  kitchenName: string
) {
  if (!process.env.SMTP_PASSWORD) {
    console.warn('[Email Service] SMTP_PASSWORD not set. Skipping email send.');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: '"Dinner Chef AI" <onboarding@resend.dev>', // Update this with your verified sender
      to: adminEmail,
      subject: `${requesterName} wants to join ${kitchenName}`,
      text: `Hello Admin,\n\n${requesterName} has requested to join your kitchen "${kitchenName}".\n\nPlease log in to the dashboard to approve or reject this request.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Kitchen Join Request</h2>
          <p>Hello Admin,</p>
          <p><strong>${requesterName}</strong> has requested to join your kitchen "<strong>${kitchenName}</strong>".</p>
          <p>Please log in to the dashboard to approve or reject this request.</p>
        </div>
      `,
    });

    console.log(`[Email Service] Email sent: ${info.messageId}`);
  } catch (error) {
    console.error('[Email Service] Error sending email:', error);
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  if (!process.env.SMTP_PASSWORD) {
    console.warn('[Email Service] SMTP_PASSWORD not set. Skipping verification email.');
    return;
  }

  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

  const fromName = process.env.SMTP_EMAIL_FROM_NAME || 'Dinner Chef AI';
  const fromEmail = process.env.SMTP_EMAIL_FROM || 'onboarding@resend.dev';

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: 'Verify your email address',
      text: `Welcome to Dinner Chef AI!\n\nPlease click the link below to verify your email address:\n${verificationUrl}\n\nIf you did not sign up, please ignore this email.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Welcome to Dinner Chef AI!</h2>
          <p>Please click the button below to verify your email address:</p>
          <a href="${verificationUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
          <p style="margin-top: 20px; font-size: 14px; color: #666;">Or copy this link: <a href="${verificationUrl}">${verificationUrl}</a></p>
        </div>
      `,
    });

    console.log(`[Email Service] Verification email sent: ${info.messageId}`);
  } catch (error) {
    console.error('[Email Service] Error sending verification email:', error);
  }
}
