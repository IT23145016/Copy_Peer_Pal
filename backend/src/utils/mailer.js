const nodemailer = require("nodemailer");

const parseBoolean = (value) => String(value).toLowerCase() === "true";

const getSmtpConfig = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = parseBoolean(process.env.SMTP_SECURE || "false");
  const from = process.env.SMTP_FROM || user;

  if (!host || !port || !user || !pass || !from) return null;
  return { host, port, user, pass, secure, from };
};

const sendAssignmentDueSoonEmails = async ({ recipients, assignment, isUrgent = false }) => {
  const config = getSmtpConfig();
  if (!config || !Array.isArray(recipients) || recipients.length === 0) {
    return { sent: 0, skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  const deadlineDate = new Date(assignment.deadline);
  const deadlineText = deadlineDate.toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
  const deadlineTime = deadlineDate.toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit"
  });
  const subject = isUrgent
    ? `Urgent: ${assignment.assignmentName} is due within 24 hours`
    : `New Assignment Published: ${assignment.assignmentName}`;
  const text = [
    isUrgent
      ? "A new assignment was published and is due soon."
      : "A new assignment was published for your year and semester.",
    `Module: ${assignment.moduleCode} - ${assignment.moduleName}`,
    `Assignment: ${assignment.assignmentName}`,
    `Due Date: ${deadlineText}`,
    `Due Time: ${deadlineTime}`,
    "",
    "Please plan and submit on time.",
  ].join("\n");

  const html = `
    <p>${isUrgent ? "A new assignment was published and is due soon." : "A new assignment was published for your year and semester."}</p>
    <p><strong>Module:</strong> ${assignment.moduleCode} - ${assignment.moduleName}</p>
    <p><strong>Assignment:</strong> ${assignment.assignmentName}</p>
    <p><strong>Due Date:</strong> ${deadlineText}</p>
    <p><strong>Due Time:</strong> ${deadlineTime}</p>
    <p>Please plan and submit on time.</p>
  `;

  const sendJobs = recipients.map((recipient) =>
    transporter.sendMail({
      from: config.from,
      to: recipient.email,
      subject,
      text,
      html,
    })
  );

  const results = await Promise.allSettled(sendJobs);
  const sent = results.filter((result) => result.status === "fulfilled").length;
  return { sent, skipped: false };
};

const sendProposalApprovedEmails = async ({ recipients, proposal }) => {
  const config = getSmtpConfig();
  if (!config || !Array.isArray(recipients) || recipients.length === 0) {
    return { sent: 0, skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  const dateText = `${proposal.date} ${proposal.startTime}-${proposal.endTime}`;
  const subject = `Study Session Approved: ${proposal.moduleCode}`;
  const text = [
    "A proposed study session you liked has been approved.",
    `Module: ${proposal.moduleCode} - ${proposal.moduleName}`,
    `When: ${dateText}`,
    proposal.meetingLink ? `Meeting Link: ${proposal.meetingLink}` : "Meeting link will be added by the creator.",
  ].join("\n");

  const html = `
    <p>A proposed study session you liked has been approved.</p>
    <p><strong>Module:</strong> ${proposal.moduleCode} - ${proposal.moduleName}</p>
    <p><strong>When:</strong> ${dateText}</p>
    <p>${proposal.meetingLink ? `<strong>Meeting Link:</strong> <a href="${proposal.meetingLink}">${proposal.meetingLink}</a>` : "Meeting link will be added by the creator."}</p>
  `;

  const sendJobs = recipients.map((recipient) =>
    transporter.sendMail({
      from: config.from,
      to: recipient.email,
      subject,
      text,
      html,
    })
  );
  const results = await Promise.allSettled(sendJobs);
  const sent = results.filter((result) => result.status === "fulfilled").length;
  return { sent, skipped: false };
};

const sendDeadlineExtendedEmails = async ({ recipients, assignment, oldDeadline }) => {
  const config = getSmtpConfig();
  if (!config || !Array.isArray(recipients) || recipients.length === 0) {
    return { sent: 0, skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });

  const fmt = (d) =>
    new Date(d).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const subject = `Deadline Extended: ${assignment.assignmentName}`;
  const text = [
    `The deadline for the following assignment has been extended.`,
    `Module: ${assignment.moduleCode} - ${assignment.moduleName}`,
    `Assignment: ${assignment.assignmentName}`,
    `Old Deadline: ${fmt(oldDeadline)}`,
    `New Deadline: ${fmt(assignment.deadline)}`,
    "",
    "Please update your schedule accordingly.",
  ].join("\n");

  const html = `
    <p>The deadline for the following assignment has been extended.</p>
    <p><strong>Module:</strong> ${assignment.moduleCode} - ${assignment.moduleName}</p>
    <p><strong>Assignment:</strong> ${assignment.assignmentName}</p>
    <p><strong>Old Deadline:</strong> ${fmt(oldDeadline)}</p>
    <p><strong>New Deadline:</strong> ${fmt(assignment.deadline)}</p>
    <p>Please update your schedule accordingly.</p>
  `;

  const results = await Promise.allSettled(
    recipients.map((r) =>
      transporter.sendMail({ from: config.from, to: r.email, subject, text, html })
    )
  );
  const sent = results.filter((r) => r.status === "fulfilled").length;
  return { sent, skipped: false };
};

module.exports = { sendAssignmentDueSoonEmails, sendProposalApprovedEmails, sendDeadlineExtendedEmails };
