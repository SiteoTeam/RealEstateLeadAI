
export const getPasswordResetEmailHtml = (
  agentName: string,
  agentEmail: string,
  resetUrl: string
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">

  <div style="max-width:600px; margin:40px auto; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.05);">

    <div style="background-color:#ffffff; padding: 32px; text-align:center; border-bottom: 1px solid #f1f5f9;">
      <div style="font-family: 'Inter', system-ui, sans-serif; font-size: 32px; font-weight: 500; color: #0f172a; letter-spacing: -1px;">
        Site<span style="color: #6366f1;">o</span>
      </div>
    </div>

    <!-- Content -->
    <div style="padding: 40px 32px;">
      <h1 style="font-size:24px; color:#0f172a; margin-bottom:24px;">Reset Your Password</h1>
      
      <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:24px;">
        Hi ${agentName},
      </p>

      <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:32px;">
        We received a request to reset your password. Click the button below to create a new password. This link expires in 1 hour.
      </p>

      <p style="text-align:center; margin-bottom:32px;">
        <a href="${resetUrl}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; font-size:16px; font-weight:bold; text-decoration:none; padding:14px 32px; border-radius:8px;">
          Reset Password
        </a>
      </p>

      <p style="font-size:14px; color:#64748b; line-height:1.6; margin-bottom:24px;">
        If you didn't request this, you can safely ignore this email.
      </p>

      <div style="border-top:1px solid #f1f5f9; padding-top:20px;">
        <p style="font-size:14px; color:#64748b; line-height:1.6; margin:0 0 4px 0;">
          <a href="mailto:siteoteam@gmail.com" style="color:#4f46e5; text-decoration:none;">siteoteam@gmail.com</a>
        </p>
        <p style="font-size:14px; color:#64748b; line-height:1.6; margin:0;">
          <a href="tel:+13234437252" style="color:#4f46e5; text-decoration:none;">(323) 443-7252</a>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color:#f1f5f9; padding:24px 32px; text-align:center;">
      <p style="margin:0; color:#94a3b8; font-size:11px;">
        Sent to ${agentEmail}
      </p>
    </div>

  </div>

</body>
</html>
`;

export const getAdminAccessEmailHtml = (
  agentName: string,
  agentEmail: string,
  adminUrl: string,
  defaultPassword: string
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">

  <div style="max-width:600px; margin:40px auto; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.05);">

    <div style="background-color:#ffffff; padding: 32px; text-align:center; border-bottom: 1px solid #f1f5f9;">
      <div style="font-family: 'Inter', system-ui, sans-serif; font-size: 32px; font-weight: 500; color: #0f172a; letter-spacing: -1px;">
        Site<span style="color: #6366f1;">o</span>
      </div>
    </div>

    <!-- Content -->
    <div style="padding: 40px 32px;">
      <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:24px;">
        Hi ${agentName.split(' ')[0]},
      </p>

      <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:24px;">
        You checked the website preview earlier – this gives you full access in case you want to explore or edit it.
      </p>

      <div style="background-color:#f8fafc; border-radius:12px; padding:24px; margin-bottom:24px;">
        <p style="margin:0 0 12px 0; font-size:14px; color:#64748b; font-weight:600;">Admin Dashboard:</p>
        <p style="margin:0 0 20px 0;">
          <a href="${adminUrl}" style="color:#4f46e5; font-size:15px; word-break:break-all;">${adminUrl}</a>
        </p>
        
        <p style="margin:0 0 8px 0; font-size:14px; color:#64748b; font-weight:600;">Temporary access password:</p>
        <p style="margin:0; font-size:18px; font-family:monospace; color:#0f172a; background:#e2e8f0; display:inline-block; padding:8px 16px; border-radius:6px;">${defaultPassword}</p>
      </div>

      <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:16px;">
        Once you log in, you can <strong>change the password immediately</strong> from the settings.
      </p>

      <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:8px;">
        From the dashboard you can:
      </p>
      <ul style="font-size:15px; color:#334155; line-height:1.8; margin:0 0 24px 0; padding-left:20px;">
        <li>Edit text and images</li>
        <li>Update contact details</li>
        <li>Publish changes instantly</li>
        <li><strong>Connect your own domain</strong> (so it runs on <em>your</em> URL)</li>
      </ul>

      <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:0;">
        If anything looks off or you have questions, just reply here.
      </p>

      <p style="font-size:16px; color:#334155; line-height:1.6; margin-top:24px;">
        – Team Siteo
      </p>

      <div style="margin-top:24px; border-top:1px solid #f1f5f9; padding-top:20px;">
        <p style="font-size:14px; color:#64748b; line-height:1.6; margin:0 0 4px 0;">
          <a href="mailto:siteoteam@gmail.com" style="color:#4f46e5; text-decoration:none;">siteoteam@gmail.com</a>
        </p>
        <p style="font-size:14px; color:#64748b; line-height:1.6; margin:0;">
          <a href="tel:+13234437252" style="color:#4f46e5; text-decoration:none;">(323) 443-7252</a>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color:#f1f5f9; padding:24px 32px; text-align:center;">
      <p style="margin:0; color:#94a3b8; font-size:11px;">
        Sent to ${agentEmail}
      </p>
    </div>

  </div>

</body>
</html>
`;

export const getTrialExpiryEmailHtml = (
  agentName: string,
  agentEmail: string,
  adminUrl: string,
  daysLeft: number
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">

  <div style="max-width:600px; margin:40px auto; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.05);">

    <div style="background-color:#ffffff; padding: 32px; text-align:center; border-bottom: 1px solid #f1f5f9;">
      <div style="font-family: 'Inter', system-ui, sans-serif; font-size: 32px; font-weight: 500; color: #0f172a; letter-spacing: -1px;">
        Site<span style="color: #6366f1;">o</span>
      </div>
    </div>

    <!-- Content -->
    <div style="padding: 40px 32px;">
      <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:24px;">
        Hi ${agentName.split(' ')[0]},
      </p>

      <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:24px;">
        Just a heads-up – your website preview is scheduled to expire in <strong>${daysLeft} days</strong>.
      </p>

      <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:8px;">
        If you want to keep it:
      </p>
      <ul style="font-size:15px; color:#334155; line-height:1.8; margin:0 0 24px 0; padding-left:20px;">
        <li>Make edits</li>
        <li>Connect your own domain</li>
        <li>Or continue using it as your main site</li>
      </ul>

      <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:24px;">
        You can access everything here:
      </p>

      <p style="text-align:center; margin-bottom:32px;">
        <a href="${adminUrl}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; font-size:16px; font-weight:bold; text-decoration:none; padding:14px 32px; border-radius:8px;">
          Go to Dashboard
        </a>
      </p>

      <p style="font-size:14px; color:#64748b; line-height:1.6; margin-bottom:0;">
        If you decide not to continue, no action needed – it'll simply deactivate.
      </p>

      <p style="font-size:16px; color:#334155; line-height:1.6; margin-top:24px;">
        – Team Siteo
      </p>

      <div style="margin-top:24px; border-top:1px solid #f1f5f9; padding-top:20px;">
        <p style="font-size:14px; color:#64748b; line-height:1.6; margin:0 0 4px 0;">
          <a href="mailto:siteoteam@gmail.com" style="color:#4f46e5; text-decoration:none;">siteoteam@gmail.com</a>
        </p>
        <p style="font-size:14px; color:#64748b; line-height:1.6; margin:0;">
          <a href="tel:+13234437252" style="color:#4f46e5; text-decoration:none;">(323) 443-7252</a>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color:#f1f5f9; padding:24px 32px; text-align:center;">
      <p style="margin:0; color:#94a3b8; font-size:11px;">
        Sent to ${agentEmail}
      </p>
    </div>

  </div>

</body>
</html>
`;
