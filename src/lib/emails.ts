// Transactional email templates for StudyTool reminder emails (Phase 7).
// Plain inline-styled HTML — email clients don't support external CSS.

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://studytool.academy";

function shell(heading: string, body: string): string {
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1e293b;">
    <div style="font-size:20px;font-weight:700;color:#4f46e5;margin-bottom:24px;">StudyTool</div>
    <h1 style="font-size:18px;font-weight:600;margin:0 0 12px;">${heading}</h1>
    ${body}
    <div style="margin-top:28px;">
      <a href="${SITE}/calendar" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 20px;border-radius:12px;font-size:14px;font-weight:500;">Open StudyTool</a>
    </div>
    <p style="font-size:12px;color:#94a3b8;margin-top:32px;">
      You're receiving this because reminders are enabled on your account.
      <a href="${SITE}/account" style="color:#94a3b8;">Manage email preferences</a>.
    </p>
  </div>`;
}

export function dailyReminderEmail(opts: {
  totalTopics: number;
  courses: { title: string; count: number }[];
}): { subject: string; html: string } {
  const { totalTopics, courses } = opts;
  const list = courses
    .map(
      (c) =>
        `<li style="margin-bottom:4px;"><strong>${escapeHtml(c.title)}</strong> — ${c.count} topic${c.count === 1 ? "" : "s"}</li>`
    )
    .join("");

  return {
    subject: `You have ${totalTopics} topic${totalTopics === 1 ? "" : "s"} to study today`,
    html: shell(
      "Today's study plan",
      `<p style="font-size:14px;line-height:1.5;margin:0 0 12px;">Here's what's on your schedule for today:</p>
       <ul style="font-size:14px;line-height:1.6;padding-left:20px;margin:0;">${list}</ul>`
    ),
  };
}

export function examCountdownEmail(opts: {
  courseTitle: string;
  daysUntil: number;
  remaining: number;
}): { subject: string; html: string } {
  const { courseTitle, daysUntil, remaining } = opts;
  return {
    subject: `${courseTitle} exam in ${daysUntil} days — ${remaining} topic${remaining === 1 ? "" : "s"} left`,
    html: shell(
      `Your ${escapeHtml(courseTitle)} exam is in ${daysUntil} days`,
      `<p style="font-size:14px;line-height:1.5;margin:0;">You still have <strong>${remaining} topic${remaining === 1 ? "" : "s"}</strong> left to study. Now's a good time to reschedule anything you've fallen behind on.</p>`
    ),
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
