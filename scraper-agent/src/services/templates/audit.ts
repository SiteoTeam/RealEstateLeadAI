
const GEORGE_HEADSHOT = 'https://jqtrgdmjosegilmbxino.supabase.co/storage/v1/object/public/agent-assets/george-headshot.png';

export const getAuditEmailHtml = (
  agentName: string,
  agentEmail: string,
  auditUrl: string,
  unsubscribeUrl?: string,
  city?: string
) => {
  const firstName = agentName.split(' ')[0];
  const cityLine = city && city !== 'Unknown'
    ? `I put together a quick digital audit for agents in ${city} — wanted to share your results.`
    : `I put together a quick digital audit — wanted to share your results.`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <!-- Hidden preview text -->
  <span style="display:none; max-height:0; overflow:hidden; mso-hide:all;">I found a few specific areas where leads might be slipping through — full breakdown inside.&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</span>

  <div style="max-width:600px; margin:40px auto; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.06);">

    <div style="padding: 40px 36px;">

      <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 20px;">
        Hi ${firstName},
      </p>

      <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 20px;">
        ${cityLine}
      </p>

      <p style="font-size:16px; color:#334155; line-height:1.7; margin:0 0 36px;">
        Found a few specific areas where leads might be slipping through. The full breakdown is at the link below (expires in 7 days).
      </p>

      <p style="margin:0 0 40px;">
        <a href="${auditUrl}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; font-size:15px; font-weight:600; text-decoration:none; padding:12px 28px; border-radius:8px;">
          View Full Report
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
      <p style="margin:0 0 16px 0; color:#94a3b8; font-size:10px; font-weight:bold; text-transform:uppercase; letter-spacing:1px;">
        Trusted by top producing agents at
      </p>

      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:0 auto; max-width:400px;">
        <tr>
          <td align="center" style="padding:0 10px;">
            <svg width="40" height="12" viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg" style="display:block; fill:#64748b;">
              <path d="M10,0 L0,0 L0,30 L10,30 L10,18 L18,30 L30,30 L18,12 L28,0 L18,0 L10,10 L10,0 Z M45,0 L35,0 L42,30 L52,30 L55,15 L58,30 L68,30 L75,0 L65,0 L62,18 L58,0 L52,0 L48,18 L45,0 Z" />
            </svg>
          </td>
          <td align="center" style="padding:0 10px;">
            <svg width="48" height="12" viewBox="0 0 120 30" xmlns="http://www.w3.org/2000/svg" style="display:block; fill:#64748b;">
              <text x="0" y="24" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="24">RE/MAX</text>
            </svg>
          </td>
          <td align="center" style="padding:0 10px;">
            <svg width="60" height="12" viewBox="0 0 280 30" xmlns="http://www.w3.org/2000/svg" style="display:block; fill:#64748b;">
              <rect x="0" y="0" width="30" height="30" rx="0" />
              <text x="5" y="21" fill="white" fontFamily="serif" fontWeight="bold" fontSize="18">CB</text>
              <text x="38" y="21" fontFamily="serif" fontWeight="normal" fontSize="16">COLDWELL BANKER</text>
            </svg>
          </td>
          <td align="center" style="padding:0 10px;">
            <svg width="32" height="12" viewBox="0 0 80 30" xmlns="http://www.w3.org/2000/svg" style="display:block; fill:#64748b;">
              <text x="0" y="22" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="24" fontStyle="italic">eXp</text>
              <path d="M50,5 L70,5 L60,25 Z" fill="#F37321" opacity="0.8" />
            </svg>
          </td>
        </tr>
      </table>

      <p style="margin:24px 0 0 0; color:#94a3b8; font-size:11px;">
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
