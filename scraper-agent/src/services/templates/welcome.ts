
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
        We put together a quick mock-up of what your own page could look like — clean, branded, and built to capture leads instead of sending them elsewhere.
      </p>

      <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:32px;">
        Worth a look?
      </p>

      <p style="text-align:center; margin-bottom:32px;">
        <a href="${websiteUrl}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; font-size:16px; font-weight:bold; text-decoration:none; padding:12px 24px; border-radius:8px;">
          See Your Preview
        </a>
      </p>

      <p style="font-size:16px; color:#334155; line-height:1.6;">
        – George at Siteo
      </p>

      <div style="margin-top:32px; border-top:1px solid #f1f5f9; padding-top:24px;">
        <p style="font-size:14px; color:#64748b; line-height:1.6; margin:0 0 4px 0;">
          <a href="mailto:siteoteam@gmail.com" style="color:#4f46e5; text-decoration:none;">siteoteam@gmail.com</a>
        </p>
        <p style="font-size:14px; color:#64748b; line-height:1.6; margin:0;">
          <a href="tel:+16268849546" style="color:#4f46e5; text-decoration:none;">(626) 884-9546</a>
        </p>
      </div>

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
