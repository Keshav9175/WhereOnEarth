import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

// Gmail's SMTP server, logged in with an App Password (not the account password).
// Without both values (e.g. a fresh clone), emails are printed to the terminal instead,
// so sign-up still works locally.
const transporter =
  GMAIL_USER && GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
      })
    : null;

type Email = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendEmail(email: Email): Promise<void> {
  if (!transporter) {
    console.info(`[email] GMAIL_USER/GMAIL_APP_PASSWORD not set — not sent.\nTo: ${email.to}\n${email.text}`);
    return;
  }

  await transporter.sendMail({
    from: `"WhereOnEarth" <${GMAIL_USER}>`,
    ...email,
  });
}

// User-typed text (the display name) goes into HTML, so it must not be able to inject markup.
function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

type ActionEmail = {
  heading: string;
  message: string;
  buttonLabel: string;
  url: string;
  footnote: string;
};

// The shared look of our "click this button" emails. Every value is escaped before going into HTML.
// Inline styles + Arial because most email apps ignore stylesheets and web fonts.
function actionEmailHtml({ heading, message, buttonLabel, url, footnote }: ActionEmail): string {
  return `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#0f172a">
        <h2 style="color:#01275e">${escapeHtml(heading)}</h2>
        <p>${escapeHtml(message)}</p>
        <p>
          <a href="${escapeHtml(url)}" style="display:inline-block;background:#fbbf24;color:#0f172a;padding:12px 20px;border-radius:10px;font-weight:bold;text-decoration:none">
            ${escapeHtml(buttonLabel)}
          </a>
        </p>
        <p style="font-size:13px;color:#475569">${escapeHtml(footnote)}</p>
      </div>`;
}

export async function sendVerificationEmail(to: string, name: string, url: string): Promise<void> {
  const footnote = "The link works for 1 hour. If you didn't sign up, you can ignore this email.";

  await sendEmail({
    to,
    subject: "Verify your WhereOnEarth email",
    text: `Hi ${name},\n\nConfirm your email to start playing WhereOnEarth:\n${url}\n\n${footnote}`,
    html: actionEmailHtml({
      heading: `Welcome to WhereOnEarth, ${name}!`,
      message: "Confirm your email to start playing.",
      buttonLabel: "Verify my email",
      url,
      footnote,
    }),
  });
}

export async function sendPasswordResetEmail(to: string, name: string, url: string): Promise<void> {
  const footnote =
    "The link works once, for 1 hour. If you didn't ask for this, ignore this email — your password stays the same.";

  await sendEmail({
    to,
    subject: "Reset your WhereOnEarth password",
    text: `Hi ${name},\n\nChoose a new WhereOnEarth password here:\n${url}\n\n${footnote}`,
    html: actionEmailHtml({
      heading: `Hi ${name},`,
      message: "Someone (hopefully you) asked to reset your WhereOnEarth password.",
      buttonLabel: "Choose a new password",
      url,
      footnote,
    }),
  });
}
