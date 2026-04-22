const cron = require("node-cron");
const Assignment = require("../models/Assignment");
const User = require("../models/User");
const { sendAssignmentDueSoonEmails } = require("./mailer");

const runDueSoonCheck = async () => {
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find assignments whose deadline falls within the next 24 hours
    const assignments = await Assignment.find({
      deadline: { $gt: now, $lte: in24h },
    });

    for (const assignment of assignments) {
      const recipients = await User.find({
        role: "user",
        isActive: { $ne: false },
        academicYear: assignment.academicYear,
        semester: assignment.semester,
      }).select("email");

      await sendAssignmentDueSoonEmails({ recipients, assignment, isUrgent: true });
    }
  } catch (err) {
    console.error("[DueSoonScheduler] Error:", err.message);
  }
};

// Runs every day at 8:00 AM
const startDueSoonScheduler = () => {
  cron.schedule("0 8 * * *", () => {
    console.log("[DueSoonScheduler] Running due-soon check...");
    runDueSoonCheck();
  });
  console.log("[DueSoonScheduler] Scheduled — runs daily at 08:00");
};

module.exports = { startDueSoonScheduler };
