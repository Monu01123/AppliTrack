// src/lib/mailer.js
//
// Sends automated follow-up reminder emails using Nodemailer.
// In development (if SMTP credentials aren't configured), it logs a preview to the terminal!

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Use Gmail App Password (not your main password)
  },
});

const sendReminderEmail = async ({ to, company, role, appliedAt }) => {
  const subject = `Follow-up Reminder: ${role} at ${company}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #3b82f6;">Time to Follow Up! 📬</h2>
      <p>Hi there,</p>
      <p>It has been 7 days since you applied for the <strong>${role}</strong> role at <strong>${company}</strong> on ${new Date(appliedAt).toLocaleDateString()}.</p>
      <p>Following up within a week can increase your chances of getting an interview by up to 30%!</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 13px; color: #64748b;">HireIQ — AI Job Application Tracker</p>
    </div>
  `;

  // If SMTP credentials aren't configured in .env, log a preview instead of throwing an error
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("\n📬 [DEV EMAIL PREVIEW] ──────────────────────────");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: Follow up on your application for ${role} at ${company}!`);
    console.log("─────────────────────────────────────────────────\n");
    return { devPreview: true };
  }

  return transporter.sendMail({
    from: `"HireIQ Reminders" <${process.env.SMTP_USER}>`,
    replyTo: process.env.SMTP_USER,
    to,
    subject,
    text: `Hi there,\n\nIt has been 7 days since you applied for the ${role} role at ${company}.\n\nFollowing up within a week can increase your chances of getting an interview by up to 30%!\n\nHireIQ — AI Job Application Tracker`,
    html,
  });
};

const sendWeeklyDigestEmail = async ({ to, name, stats }) => {
  const subject = `Your Weekly Job Search Digest 📈`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #0f172a; color: #f8fafc;">
      <h2 style="color: #38bdf8;">Your Weekly Job Search Progress 🚀</h2>
      <p>Hi ${name || "there"},</p>
      <p>Here is your job application performance summary for the past 7 days:</p>
      <div style="background-color: #1e293b; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p><strong>Total Applications:</strong> ${stats.total}</p>
        <p><strong>Applied This Week:</strong> ${stats.newThisWeek}</p>
        <p><strong>Active Interviews:</strong> ${stats.interviews}</p>
        <p><strong>Offers Received:</strong> ${stats.offers}</p>
      </div>
      <p>Keep the momentum going! Log in to HireIQ to track upcoming interviews and follow-ups.</p>
      <hr style="border: none; border-top: 1px solid #334155; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b;">HireIQ — AI Job Application Tracker</p>
    </div>
  `;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("\n📬 [DEV WEEKLY DIGEST EMAIL PREVIEW] ──────────");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Summary: Total=${stats.total}, NewThisWeek=${stats.newThisWeek}, Interviews=${stats.interviews}, Offers=${stats.offers}`);
    console.log("─────────────────────────────────────────────────\n");
    return { devPreview: true, stats };
  }

  return transporter.sendMail({
    from: `"HireIQ Digest" <${process.env.SMTP_USER}>`,
    replyTo: process.env.SMTP_USER,
    to,
    subject,
    text: `Hi ${name || "there"},\n\nHere is your job application performance summary for the past 7 days:\n\nTotal Applications: ${stats.total}\nApplied This Week: ${stats.newThisWeek}\nActive Interviews: ${stats.interviews}\nOffers Received: ${stats.offers}\n\nKeep the momentum going! Log in to HireIQ to track upcoming interviews and follow-ups.`,
    html,
  });
};

const sendVerificationEmail = async ({ to, token }) => {
  // The backend API URL (usually process.env.API_URL or default to localhost:5000)
  const apiUrl = process.env.VITE_API_URL || "http://localhost:5000/api";
  
  // The link MUST point directly to the backend route so it can verify the token and then redirect.
  const verificationLink = `${apiUrl}/auth/verify-email?token=${token}`;
  
  const subject = "Verify your HireIQ account";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #3b82f6;">Welcome to HireIQ! 🎉</h2>
      <p>Hi there,</p>
      <p>Please click the button below to verify your email address and activate your account:</p>
      <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #3b82f6; text-decoration: none; border-radius: 5px; margin: 20px 0;">Verify Email</a>
      <p>If you didn't create an account, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 13px; color: #64748b;">HireIQ — AI Job Application Tracker</p>
    </div>
  `;

  // Fallback for development if SMTP is not configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("\n=======================================================");
    console.log("✉️  MOCK EMAIL SENT (SMTP credentials missing in .env)");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`🔗 VERIFICATION LINK: ${verificationLink}`);
    console.log("=======================================================\n");
    return true;
  }

  return transporter.sendMail({
    from: `"HireIQ" <${process.env.SMTP_USER}>`,
    replyTo: process.env.SMTP_USER,
    to,
    subject,
    text: `Hi there,\n\nPlease go to the following link to verify your email address and activate your account:\n\n${verificationLink}\n\nIf you didn't create an account, you can safely ignore this email.\n\nHireIQ — AI Job Application Tracker`,
    html,
  });
};

module.exports = { sendReminderEmail, sendWeeklyDigestEmail, sendVerificationEmail };
