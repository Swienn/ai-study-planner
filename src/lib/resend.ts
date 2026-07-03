import { Resend } from "resend";

/**
 * Lazy Resend singleton — mirrors the Stripe pattern so a missing API key
 * doesn't crash the build. Server-side only; never import in client code.
 */
let client: Resend | null = null;

function getResend(): Resend {
  if (!client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    client = new Resend(key);
  }
  return client;
}

const FROM = "StudyTool <reminders@studytool.academy>";

export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}
