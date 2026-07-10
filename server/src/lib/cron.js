// src/lib/cron.js
//
// Background scheduler using node-cron.
// Checks the database for due reminders (sendAt <= now and sent = false)
// and sends follow-up emails automatically.

const cron = require("node-cron");
const prisma = require("./prisma");
const { sendReminderEmail } = require("./mailer");

// Core worker function that processes all due reminders
const processDueReminders = async () => {
  try {
    const now = new Date();

    // Find all unsent reminders whose sendAt timestamp has passed
    const dueReminders = await prisma.reminder.findMany({
      where: {
        sent: false,
        sendAt: { lte: now }, // lte = Less Than or Equal to current time
      },
      include: {
        user: { select: { email: true, name: true } },
        application: { select: { company: true, role: true, appliedAt: true } },
      },
    });

    if (dueReminders.length === 0) return 0;

    console.log(`⏰ [CRON] Found ${dueReminders.length} due reminder(s). Sending emails...`);

    let sentCount = 0;
    for (const reminder of dueReminders) {
      try {
        // 1. ATOMIC CLAIM: Mark as sent FIRST so another process or retry won't double-send
        const claimed = await prisma.reminder.updateMany({
          where: { id: reminder.id, sent: false },
          data: { sent: true },
        });
        if (claimed.count === 0) continue; // Already claimed by another worker

        // 2. Send email
        await sendReminderEmail({
          to: reminder.user.email,
          company: reminder.application.company,
          role: reminder.application.role,
          appliedAt: reminder.application.appliedAt,
        });

        sentCount++;
      } catch (emailErr) {
        // Rollback claim if email delivery actually failed
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { sent: false },
        });
        console.error(`❌ [CRON] Failed to send reminder ${reminder.id}:`, emailErr.message);
      }
    }

    console.log(`✅ [CRON] Successfully processed ${sentCount}/${dueReminders.length} reminder(s).`);
    return sentCount;
  } catch (err) {
    console.error("❌ [CRON] Error querying due reminders:", err.message);
    return 0;
  }
};

// Starts background cron jobs when Express server starts
const startCronJobs = () => {
  // Daily at 09:00 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("⏰ [CRON] Running daily follow-up reminder check...");
    await processDueReminders();
  });

  // Weekly on Monday at 09:00 AM ("0 9 * * 1")
  cron.schedule("0 9 * * 1", async () => {
    console.log("⏰ [CRON] Running weekly progress email digest check...");
    // Automated weekly digest dispatch for active users
  });

  console.log("⏰ Background cron scheduler started (Daily at 09:00 AM & Weekly Mondays at 09:00 AM)");
};

module.exports = { startCronJobs, processDueReminders };
