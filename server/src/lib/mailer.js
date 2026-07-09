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

module.exports = { sendReminderEmail };
