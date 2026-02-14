
export const getAuditEmailHtml = (
  agentName: string,
  agentEmail: string,
  auditUrl: string,
  unsubscribeUrl?: string
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Inter', Helvetica, Arial, sans-serif;">

  <div style="max-width:600px; margin:40px auto; background-color:#ffffff; border-radius:12px; overflow:hidden; border: 1px solid #e2e8f0;">

    <div style="padding: 40px 32px;">
      <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:24px;">
        Hi ${agentName.split(' ')[0]},
      </p>

      <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:24px;">
        We analyzed your digital footprint to see how you compare to top agents in your market.
      </p>

      <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:32px;">
        We found <strong>3 key areas</strong> where you might be losing potential leads.
      </p>

      <div style="background-color:#f1f5f9; padding:24px; border-radius:8px; text-align:center; margin-bottom:32px;">
        <p style="margin:0 0 16px 0; font-size:14px; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:1px;">
          YOUR ANALYSIS IS READY
        </p>
        <a href="${auditUrl}" style="display:inline-block; background-color:#1e293b; color:#ffffff; font-size:16px; font-weight:600; text-decoration:none; padding:14px 28px; border-radius:6px;">
          View Full Report
        </a>
      </div>

      <p style="font-size:14px; color:#64748b; line-height:1.6; margin-bottom:0;">
        This link is private and will expire in 7 days.
      </p>
    </div>

    <div style="background-color:#f8fafc; padding:20px 32px; text-align:center; border-top:1px solid #e2e8f0;">
      <p style="margin:0 0 16px 0; color:#94a3b8; font-size:10px; font-weight:bold; text-transform:uppercase; letter-spacing:1px;">
        Trusted by top producing agents at
      </p>
      
      <!-- Logos Grid -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:0 auto; max-width:400px;">
        <tr>
          <!-- KW -->
          <td align="center" style="padding:0 10px;">
             <!-- Keller Williams (Path) -->
             <svg width="40" height="12" viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg" style="display:block; fill:#64748b;">
                <path d="M10,0 L0,0 L0,30 L10,30 L10,18 L18,30 L30,30 L18,12 L28,0 L18,0 L10,10 L10,0 Z M45,0 L35,0 L42,30 L52,30 L55,15 L58,30 L68,30 L75,0 L65,0 L62,18 L58,0 L52,0 L48,18 L45,0 Z" />
             </svg>
          </td>
          <!-- RE/MAX -->
          <td align="center" style="padding:0 10px;">
             <svg width="48" height="12" viewBox="0 0 120 30" xmlns="http://www.w3.org/2000/svg" style="display:block; fill:#64748b;">
                <text x="0" y="24" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="24">RE/MAX</text>
             </svg>
          </td>
          <!-- CB -->
          <td align="center" style="padding:0 10px;">
             <svg width="60" height="12" viewBox="0 0 280 30" xmlns="http://www.w3.org/2000/svg" style="display:block; fill:#64748b;">
                 <rect x="0" y="0" width="30" height="30" rx="0" />
                 <text x="5" y="21" fill="white" fontFamily="serif" fontWeight="bold" fontSize="18">CB</text>
                 <text x="38" y="21" fontFamily="serif" fontWeight="normal" fontSize="16">COLDWELL BANKER</text>
             </svg>
          </td>
           <!-- eXp -->
          <td align="center" style="padding:0 10px;">
             <svg width="32" height="12" viewBox="0 0 80 30" xmlns="http://www.w3.org/2000/svg" style="display:block; fill:#64748b;">
                 <text x="0" y="22" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="24" fontStyle="italic">eXp</text>
                 <path d="M50,5 L70,5 L60,25 Z" fill="#F37321" opacity="0.8" />
             </svg>
          </td>
        </tr>
      </table>

      <p style="margin:24px 0 0 0; color:#94a3b8; font-size:12px;">
        Sent to ${agentEmail}
        ${unsubscribeUrl ? `
        <br/><br/>
        <a href="${unsubscribeUrl}" style="color:#94a3b8; text-decoration:underline;">Unsubscribe</a>
        ` : ''}
      </p>
    </div>

  </div>

</body>
</html>
`;
