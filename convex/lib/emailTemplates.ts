type SubInfo = {
  vendor: string;
  amountInr: number; // paise
  cycle: "monthly" | "quarterly" | "yearly" | "one_time";
  nextRenewal: number;
};

function formatRupees(paise: number): string {
  const rupees = Math.round(paise) / 100;
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    rupees,
  )}`;
}

function formatIstDate(ms: number): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(ms));
}

const baseStyles = `
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
background-color: #f6f3ec;
color: #0f1a16;
padding: 32px 24px;
line-height: 1.55;
`;

const cardStyles = `
max-width: 520px;
margin: 0 auto;
background-color: #ede8dc;
border: 1px solid rgba(15, 26, 22, 0.16);
border-radius: 4px;
padding: 24px 28px;
`;

export function dayBeforeAlert(opts: {
  sub: SubInfo;
  dashboardUrl: string;
}): { subject: string; html: string; text: string } {
  const { sub, dashboardUrl } = opts;
  const amount = formatRupees(sub.amountInr);
  const date = formatIstDate(sub.nextRenewal);

  const subject = `${sub.vendor} renews tomorrow for ${amount}`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f3ec;">
<div style="${baseStyles}">
  <div style="${cardStyles}">
    <p style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#5c6a62;margin:0 0 14px 0;">Renewal tomorrow</p>
    <h1 style="font-size:26px;font-weight:400;line-height:1.2;margin:0 0 16px 0;font-family:Georgia,serif;color:#0f1a16;">
      ${escapeHtml(sub.vendor)} — ${amount}
    </h1>
    <p style="font-size:15px;color:#5c6a62;margin:0 0 18px 0;">
      Charges on ${date}.
    </p>
    <p style="font-size:13px;color:#5c6a62;margin:0 0 22px 0;">
      Cycle: ${sub.cycle === "one_time" ? "one-time" : sub.cycle}.
    </p>
    <a href="${dashboardUrl}" style="display:inline-block;background:#1f4d3f;color:#f6f3ec;text-decoration:none;padding:10px 18px;border-radius:3px;font-size:14px;">
      Open Renewl
    </a>
  </div>
  <p style="text-align:center;font-size:12px;color:#8a9388;margin-top:28px;">
    You're getting this because you're tracking subscriptions on Renewl.
  </p>
</div>
</body></html>`;

  const text = [
    `${sub.vendor} renews tomorrow.`,
    `Amount: ${amount}`,
    `Date: ${date}`,
    `Cycle: ${sub.cycle === "one_time" ? "one-time" : sub.cycle}`,
    ``,
    `Open Renewl: ${dashboardUrl}`,
  ].join("\n");

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
