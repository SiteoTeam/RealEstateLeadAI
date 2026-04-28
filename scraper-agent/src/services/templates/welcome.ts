
const GEORGE_HEADSHOT = 'https://jqtrgdmjosegilmbxino.supabase.co/storage/v1/object/public/agent-assets/george-headshot.png';

export const getWelcomeEmailHtml = (
  agentName: string,
  agentEmail: string,
  websiteUrl: string,
  unsubscribeUrl?: string,
  city?: string
) => {
  const firstName = agentName.split(' ')[0];
  const cityLine = city && city !== 'Unknown'
    ? `I searched for real estate agents in ${city} and noticed your Coldwell Banker profile doesn't have a standalone page that ranks for your name.`
    : `I noticed your Coldwell Banker profile doesn't have a standalone page that ranks for your name.`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>your listings</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <!-- Hidden preview text -->
  <span style="display:none; max-height:0; overflow:hidden; mso-hide:all;">Buyers are searching your name and landing on Zillow — here's what your own page could look like.&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</span>

  <div style="max-width:600px; margin:40px auto; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.06);">

    <!-- Main Content -->
    <div style="padding: 40px 36px;">

      <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 20px;">
        Hi ${firstName},
      </p>

      <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 20px;">
        Quick one — ${cityLine}
      </p>

      <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 32px;">
        I put one together for you. No signup needed, just a preview.
      </p>

      <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 36px;">
        Worth a look?
      </p>

      <p style="margin:0 0 40px;">
        <a href="${websiteUrl}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; padding:12px 28px; border-radius:8px;">
          See Your Preview
        </a>
      </p>

      <!-- Signature -->
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

    </div>

    <!-- Footer -->
    <div style="background-color:#f8fafc; padding:20px 36px; text-align:center; border-top:1px solid #e2e8f0;">
      <p style="margin:0; color:#94a3b8; font-size:11px;">
        Sent to ${agentEmail}
        ${unsubscribeUrl ? `
        &nbsp;·&nbsp;
        <a href="${unsubscribeUrl}" style="color:#94a3b8; text-decoration:underline;">Unsubscribe</a>
        ` : ''}
      </p>
    </div>

  </div>
</body>
</html>`;
};
