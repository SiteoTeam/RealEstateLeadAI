
export const getContactEmailHtml = (
    visitorName: string,
    visitorEmail: string,
    visitorPhone: string | undefined,
    message: string
) => `
                <!-- Preview in browser to see the final result -->
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap" rel="stylesheet">
  </head>
<body style="margin:0; padding:40px 20px; background:#eef2f7; font-family: Arial, sans-serif;">

<div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08);">

  <!-- Header Bar -->
  <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 28px 32px; text-align:center;">
    <p style="margin:0; color:#f59e0b; font-size:13px; text-transform:uppercase; letter-spacing:2px; font-weight:bold;">Siteo</p>
    <h1 style="margin:8px 0 0 0; color:#ffffff; font-size:20px; font-weight:600;">New Contact Form Submission</h1>
  </div>

  <!-- Body -->
  <div style="padding: 28px 32px 20px;">

    <!-- Sender Card -->
    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:20px 22px; margin-bottom:24px;">
      <table style="width:100%; border-collapse:collapse;">
        <tr>
          <td style="padding:7px 0; width:70px;">
            <span style="display:inline-block; background:#f59e0b; color:#fff; font-size:11px; font-weight:bold; padding:3px 8px; border-radius:4px;">FROM</span>
          </td>
          <td style="padding:7px 0; color:#1e293b; font-weight:600; font-size:15px;">${visitorName}</td>
        </tr>
        <tr>
          <td style="padding:7px 0;">
            <span style="display:inline-block; background:#cbd5e1; color:#475569; font-size:11px; font-weight:bold; padding:3px 8px; border-radius:4px;">EMAIL</span>
          </td>
          <td style="padding:7px 0;">
            <a href="mailto:${visitorEmail}" style="color:#3b82f6; text-decoration:none; font-size:14px;">${visitorEmail}</a>
          </td>
        </tr>
        <!-- Phone row — only rendered if visitorPhone exists -->
        ${visitorPhone ? `
        <tr>
          <td style="padding:7px 0;">
            <span style="display:inline-block; background:#cbd5e1; color:#475569; font-size:11px; font-weight:bold; padding:3px 8px; border-radius:4px;">PHONE</span>
          </td>
          <td style="padding:7px 0;">
            <a href="tel:${visitorPhone}" style="color:#3b82f6; text-decoration:none; font-size:14px;">${visitorPhone}</a>
          </td>
        </tr>
        ` : ''}
      </table>
    </div>

    <!-- Message Section -->
    <div style="margin-bottom:24px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
        <div style="width:3px; height:18px; background:#f59e0b; border-radius:2px;"></div>
        <h3 style="margin:0; color:#1e293b; font-size:15px; font-weight:600;">Message</h3>
      </div>
      <div style="background:#fafafa; border:1px solid #f1f5f9; border-radius:10px; padding:18px 20px;">
        <p style="margin:0; color:#334155; line-height:1.7; font-size:14px; white-space:pre-wrap;">${message}</p>
      </div>
    </div>

  </div>

  <!-- Footer -->
  <div style="background:#f1f5f9; border-top:1px solid #e2e8f0; padding:20px 32px; text-align:center;">
    <p style="margin:0 0 6px 0; color:#64748b; font-size:12px; line-height:1.5;">
      This is an <strong style="color:#475569;">automated notification</strong> — do not reply to this email.
    </p>
    <p style="margin:0; color:#94a3b8; font-size:11px; line-height:1.5;">
      To respond to ${visitorName}, please use their contact details above.
    </p>
    <p style="margin:16px 0 0 0; color:#cbd5e1; font-size:11px;">
      Sent via Siteo &middot; Contact Form Notification
    </p>
  </div>

</div>

</body>
</html>
            `;
