
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
    ? `When someone Googles your name in ${city}, they land on Zillow — not your site.`
    : `When buyers Google your name, they land on Zillow — not your site.`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>your listings</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <!-- Hidden preview text -->
  <span style="display:none; max-height:0; overflow:hidden; mso-hide:all;">Buyers are clicking Zillow instead of finding you directly — here's what that page could look like.&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</span>

  <div style="max-width:600px; margin:40px auto; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.05);">

    <!-- Header with Logo -->
    <div style="background-color:#ffffff; padding: 32px; text-align:center; border-bottom: 1px solid #f1f5f9;">
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; font-size: 32px; font-weight: 500; color: #0f172a; letter-spacing: -1px;">
        Site<span style="color: #6366f1;">o</span>
      </div>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 32px;">

      <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:24px;">
        Hi ${firstName},
      </p>

      <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:24px;">
        ${cityLine}
      </p>

      <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:24px;">
        I put together a quick mock-up of what your own page could look like — clean, branded, and built to capture leads instead of sending them elsewhere.
      </p>

      <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:32px;">
        Worth a look?
      </p>

      <p style="text-align:center; margin-bottom:40px;">
        <a href="${websiteUrl}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; font-size:16px; font-weight:bold; text-decoration:none; padding:12px 24px; border-radius:8px;">
          See Your Preview
        </a>
      </p>

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
          </td>
        </tr>
      </table>

    </div>

    <!-- Footer -->
    <div style="background-color:#f1f5f9; padding:24px 32px; text-align:center; border-top:1px solid #e2e8f0;">
      <p style="margin:0; color:#94a3b8; font-size:11px;">
        Sent to ${agentEmail}
        ${unsubscribeUrl ? `
        <br/><br/>
        <a href="${unsubscribeUrl}" style="color:#94a3b8; text-decoration:underline;">Unsubscribe</a>
        ` : ''}
      </p>
    </div>

  </div>
</body>
</html>`;
};
