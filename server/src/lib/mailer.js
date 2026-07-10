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
    to,
    subject,
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
    to,
    subject,
    html,
  });
};

module.exports = { sendReminderEmail, sendWeeklyDigestEmail };
