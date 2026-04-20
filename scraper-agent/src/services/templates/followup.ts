
const GEORGE_HEADSHOT = 'https://jqtrgdmjosegilmbxino.supabase.co/storage/v1/object/public/agent-assets/george-headshot.png';

const signature = (unsubscribeUrl?: string, agentEmail?: string) => `
  <!-- Signature -->
  <table cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
    <tr>
      <td style="padding-right:14px; vertical-align:middle;">
        <img src="${GEORGE_HEADSHOT}" alt="George" width="56" height="56" style="width:56px; height:56px; border-radius:50%; object-fit:cover; display:block;" />
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
  ${agentEmail ? `
  <div style="background-color:#f1f5f9; margin-top:32px; padding:24px 0; text-align:center; border-top:1px solid #e2e8f0;">
    <p style="margin:0; color:#94a3b8; font-size:11px;">
      Sent to ${agentEmail}
      ${unsubscribeUrl ? `<br/><br/><a href="${unsubscribeUrl}" style="color:#94a3b8; text-decoration:underline;">Unsubscribe</a>` : ''}
    </p>
  </div>` : ''}
`;

const wrapper = (previewText: string, content: string) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <span style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${previewText}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</span>
  <div style="max-width:600px; margin:40px auto; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.05);">
    <div style="background-color:#ffffff; padding: 32px; text-align:center; border-bottom: 1px solid #f1f5f9;">
      <div style="font-family: 'Inter', system-ui, sans-serif; font-size: 32px; font-weight: 500; color: #0f172a; letter-spacing: -1px;">
        Site<span style="color: #6366f1;">o</span>
      </div>
    </div>
    <div style="padding: 40px 32px;">
      ${content}
    </div>
  </div>
</body>
</html>`;

// Step 2 — Day 3: Bump
export const getFollowup1Html = (
  agentName: string,
  agentEmail: string,
  websiteUrl: string,
  unsubscribeUrl?: string,
  city?: string
) => {
  const firstName = agentName.split(' ')[0];
  return wrapper(
    `Just wanted to make sure this didn't get buried — your preview is still live.`,
    `
    <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:24px;">Hey ${firstName},</p>
    <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:24px;">
      Just wanted to make sure my last message didn't get buried — I put together a mock-up of what your site could look like${city && city !== 'Unknown' ? ` for buyers in ${city}` : ''}.
    </p>
    <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:32px;">
      It's live at the link below if you want to take a look.
    </p>
    <p style="text-align:center; margin-bottom:40px;">
      <a href="${websiteUrl}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; font-size:16px; font-weight:bold; text-decoration:none; padding:12px 24px; border-radius:8px;">
        See Your Preview
      </a>
    </p>
    ${signature(unsubscribeUrl, agentEmail)}
    `
  );
};

// Step 3 — Day 7: Insight angle
export const getFollowup2Html = (
  agentName: string,
  agentEmail: string,
  websiteUrl: string,
  unsubscribeUrl?: string,
  city?: string
) => {
  const firstName = agentName.split(' ')[0];
  const cityContext = city && city !== 'Unknown' ? ` in ${city}` : '';
  return wrapper(
    `One specific thing I noticed about your search results — worth 30 seconds.`,
    `
    <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:24px;">Hey ${firstName},</p>
    <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:24px;">
      One thing I noticed: when I searched your name${cityContext}, the top results were Zillow, Realtor.com, and your brokerage page — your own site wasn't in the first page at all.
    </p>
    <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:24px;">
      Every buyer who searches you clicks one of those instead. That's their contact form, not yours.
    </p>
    <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:32px;">
      The mock-up I built for you fixes exactly that — it's a page that actually ranks for your name and sends leads directly to you.
    </p>
    <p style="text-align:center; margin-bottom:40px;">
      <a href="${websiteUrl}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; font-size:16px; font-weight:bold; text-decoration:none; padding:12px 24px; border-radius:8px;">
        See Your Preview
      </a>
    </p>
    ${signature(unsubscribeUrl, agentEmail)}
    `
  );
};

// Step 4 — Day 14: Social proof
export const getFollowup3Html = (
  agentName: string,
  agentEmail: string,
  websiteUrl: string,
  unsubscribeUrl?: string,
  city?: string
) => {
  const firstName = agentName.split(' ')[0];
  const cityContext = city && city !== 'Unknown' ? ` in ${city}` : '';
  return wrapper(
    `An agent nearby just activated their site — they got their first inbound lead within a week.`,
    `
    <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:24px;">Hey ${firstName},</p>
    <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:24px;">
      An agent${cityContext} just activated their Siteo site last week and got their first inbound lead within a few days — just from being findable on Google by their own name.
    </p>
    <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:32px;">
      Your preview has been ready since my first email. Wanted to send one last nudge in case the timing is better now.
    </p>
    <p style="text-align:center; margin-bottom:40px;">
      <a href="${websiteUrl}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; font-size:16px; font-weight:bold; text-decoration:none; padding:12px 24px; border-radius:8px;">
        See Your Preview
      </a>
    </p>
    ${signature(unsubscribeUrl, agentEmail)}
    `
  );
};

// Step 5 — Day 21: Breakup
export const getFollowup4Html = (
  agentName: string,
  agentEmail: string,
  websiteUrl: string,
  unsubscribeUrl?: string
) => {
  const firstName = agentName.split(' ')[0];
  return wrapper(
    `Last one from me — I'll get out of your inbox after this.`,
    `
    <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:24px;">Hey ${firstName},</p>
    <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:24px;">
      Last one from me — I don't want to keep cluttering your inbox.
    </p>
    <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:32px;">
      Your preview is still live at the link below whenever the time is right. If you ever want to chat about it, you can book a quick call on my calendar.
    </p>
    <p style="text-align:center; margin-bottom:16px;">
      <a href="${websiteUrl}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; font-size:16px; font-weight:bold; text-decoration:none; padding:12px 24px; border-radius:8px;">
        See Your Preview
      </a>
    </p>
    <p style="text-align:center; margin-bottom:40px; font-size:14px; color:#64748b;">
      <a href="https://calendly.com/siteoteam/30min" style="color:#4f46e5; text-decoration:none;">Or book a 30-min call →</a>
    </p>
    ${signature(unsubscribeUrl, agentEmail)}
    `
  );
};
