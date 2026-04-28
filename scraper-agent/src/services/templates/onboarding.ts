
const GEORGE_HEADSHOT = 'https://jqtrgdmjosegilmbxino.supabase.co/storage/v1/object/public/agent-assets/george-headshot.png';

const signature = () => `
  <table cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #f1f5f9; padding-top:24px;">
    <tr>
      <td style="padding-right:14px; vertical-align:middle;">
        <img src="${GEORGE_HEADSHOT}" alt="George" width="52" height="52" style="width:52px; height:52px; border-radius:50%; object-fit:cover; display:block;" />
      </td>
      <td style="vertical-align:middle;">
        <p style="margin:0; font-size:15px; font-weight:600; color:#0f172a; line-height:1.4;">George</p>
        <p style="margin:0; font-size:13px; color:#6366f1; line-height:1.4;">Siteo</p>
        <p style="margin:4px 0 0; font-size:13px; color:#64748b; line-height:1.4;">
          <a href="mailto:george@siteo.io" style="color:#64748b; text-decoration:none;">george@siteo.io</a>
          &nbsp;·&nbsp;
          <a href="tel:+16268849546" style="color:#64748b; text-decoration:none;">(626) 884-9546</a>
        </p>
        <p style="margin:6px 0 0; font-size:13px; line-height:1.4;">
          <a href="https://calendly.com/siteoteam/30min" style="color:#4f46e5; text-decoration:none; font-weight:600;">📅 Book a call</a>
          &nbsp;&nbsp;
          <a href="https://www.instagram.com/web.dev.george/" style="color:#64748b; text-decoration:none;">Instagram</a>
        </p>
      </td>
    </tr>
  </table>
`;

const wrapper = (previewText: string, content: string, agentEmail: string) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <span style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${previewText}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</span>
  <div style="max-width:600px; margin:40px auto; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <div style="padding: 40px 36px;">
      ${content}
      ${signature()}
    </div>
    <div style="background-color:#f8fafc; padding:16px 36px; text-align:center; border-top:1px solid #e2e8f0;">
      <p style="margin:0; color:#94a3b8; font-size:11px;">Sent to ${agentEmail}</p>
    </div>
  </div>
</body>
</html>`;

// Day 0 — sent immediately when trial starts (after admin access email)
export const getOnboarding1Html = (
  agentName: string,
  agentEmail: string,
  adminUrl: string,
  defaultPassword: string
) => {
  const firstName = agentName.split(' ')[0];
  return wrapper(
    `Three quick things worth doing in your dashboard first.`,
    `
    <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 20px;">Hey ${firstName},</p>
    <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 20px;">
      You're in. Here's your dashboard:
    </p>
    <p style="margin:0 0 8px;">
      <a href="${adminUrl}" style="font-size:15px; color:#4f46e5; text-decoration:none; font-weight:600;">${adminUrl}</a>
    </p>
    <p style="font-size:14px; color:#64748b; margin:0 0 32px;">
      Password: <code style="background:#f1f5f9; padding:2px 8px; border-radius:4px; font-size:14px;">${defaultPassword}</code>
    </p>
    <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 12px;">Three things worth doing first:</p>
    <ol style="margin:0 0 32px; padding-left:20px; color:#334155; font-size:16px; line-height:2;">
      <li>Add your headshot if it's not showing up correctly</li>
      <li>Update the contact form email so leads go directly to you</li>
      <li>Pull it up on your phone — that's how most buyers will see it</li>
    </ol>
    <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 36px;">
      Takes about 5 minutes. Let me know if anything looks off.
    </p>
    `,
    agentEmail
  );
};

// Day 2 — contact form check
export const getOnboarding2Html = (
  agentName: string,
  agentEmail: string,
  adminUrl: string
) => {
  const firstName = agentName.split(' ')[0];
  return wrapper(
    `One thing to check in your dashboard before leads start coming in.`,
    `
    <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 20px;">Hey ${firstName},</p>
    <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 20px;">
      Have you had a chance to log in yet?
    </p>
    <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 20px;">
      The one thing I'd fix first: make sure your contact form is pointing to the right email. By default it routes to whatever we pulled from your profile — worth confirming that it's actually going to you.
    </p>
    <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 36px;">
      You can change it in <strong>Settings → Contact Email</strong>.
    </p>
    <p style="margin:0 0 40px;">
      <a href="${adminUrl}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; padding:12px 28px; border-radius:8px;">
        Go to Dashboard
      </a>
    </p>
    `,
    agentEmail
  );
};

// Day 5 — lead log feature highlight
export const getOnboarding3Html = (
  agentName: string,
  agentEmail: string,
  adminUrl: string
) => {
  const firstName = agentName.split(' ')[0];
  return wrapper(
    `One feature most agents miss — worth checking if you've gotten any inquiries already.`,
    `
    <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 20px;">Hey ${firstName},</p>
    <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 20px;">
      One thing most agents don't notice right away — there's a lead log in your dashboard that tracks every form submission and shows you who's visited.
    </p>
    <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 36px;">
      Easy to miss. Worth checking to see if you've gotten any inquiries already.
    </p>
    <p style="margin:0 0 40px;">
      <a href="${adminUrl}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; padding:12px 28px; border-radius:8px;">
        Check Lead Log
      </a>
    </p>
    `,
    agentEmail
  );
};
