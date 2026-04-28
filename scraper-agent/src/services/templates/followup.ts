
const GEORGE_HEADSHOT = 'https://jqtrgdmjosegilmbxino.supabase.co/storage/v1/object/public/agent-assets/george-headshot.png';

const signature = (unsubscribeUrl?: string, agentEmail?: string) => `
  <table cellpadding="0" cellspacing="0" border="0" style="margin-top:8px; border-top:1px solid #f1f5f9; padding-top:24px;">
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
  ${agentEmail ? `
  <div style="background-color:#f8fafc; margin-top:32px; padding:16px 0; text-align:center; border-top:1px solid #e2e8f0;">
    <p style="margin:0; color:#94a3b8; font-size:11px;">
      Sent to ${agentEmail}
      ${unsubscribeUrl ? `&nbsp;·&nbsp;<a href="${unsubscribeUrl}" style="color:#94a3b8; text-decoration:underline;">Unsubscribe</a>` : ''}
    </p>
  </div>` : ''}
`;

const wrapper = (previewText: string, content: string) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <span style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${previewText}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</span>
  <div style="max-width:600px; margin:40px auto; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <div style="padding: 40px 36px;">
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
    `Your preview is still live — takes 30 seconds to see.`,
    `
    <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 20px;">Hey ${firstName},</p>
    <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 20px;">
      Wanted to make sure my last email didn't get buried.
    </p>
    <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 36px;">
      Your preview is still live at the link below — takes 30 seconds to see.
    </p>
    <p style="margin:0 0 40px;">
      <a href="${websiteUrl}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; padding:12px 28px; border-radius:8px;">
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
    `When I search your name, Zillow comes up first — not you.`,
    `
    <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 20px;">Hey ${firstName},</p>
    <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 20px;">
      When I search your name${cityContext}, the first results are Zillow, Realtor.com, and your brokerage page. Your own site isn't there.
    </p>
    <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 20px;">
      Every buyer who searches you ends up on their contact form instead of yours.
    </p>
    <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 36px;">
      The page I built for you would rank for your name and send those leads directly to you.
    </p>
    <p style="margin:0 0 40px;">
      <a href="${websiteUrl}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; padding:12px 28px; border-radius:8px;">
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
    `An agent nearby got their first inbound lead last week — just from being searchable by name.`,
    `
    <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 20px;">Hey ${firstName},</p>
    <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 20px;">
      An agent${cityContext} activated their site two weeks ago. She got a direct inbound inquiry last week from someone who Googled her name — didn't go through Zillow at all.
    </p>
    <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 36px;">
      Your preview has been ready since my first email. Sharing one more time in case the timing is better now.
    </p>
    <p style="margin:0 0 40px;">
      <a href="${websiteUrl}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; padding:12px 28px; border-radius:8px;">
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
    `Last one from me — your preview is still there whenever the time is right.`,
    `
    <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 20px;">Hey ${firstName},</p>
    <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 20px;">
      Not going to keep sending these — I know your inbox is busy.
    </p>
    <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 36px;">
      Your preview is still live at the link below whenever it makes sense. And if you'd rather just jump on a quick call, my calendar is open.
    </p>
    <p style="margin:0 0 16px;">
      <a href="${websiteUrl}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; padding:12px 28px; border-radius:8px;">
        See Your Preview
      </a>
    </p>
    <p style="margin:0 0 40px; font-size:14px; color:#64748b;">
      <a href="https://calendly.com/siteoteam/30min" style="color:#4f46e5; text-decoration:none;">Or book a 30-min call →</a>
    </p>
    ${signature(unsubscribeUrl, agentEmail)}
    `
  );
};
