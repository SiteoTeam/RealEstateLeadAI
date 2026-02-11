/**
 * Resend Email Service
 * 
 * Handles sending contact form emails via Resend.
 */

import { Resend } from 'resend';

// Initialize Resend client safely
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.warn('[Email] RESEND_API_KEY is not set. Email sending will be disabled.');
}
export const resend = apiKey ? new Resend(apiKey) : null;

// The "From" email must be from your verified domain
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hello@siteo.io';

interface ContactFormData {
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  message: string;
  agentName: string;
  agentEmail: string;
}

export async function sendContactEmail(data: ContactFormData): Promise<{ success: boolean; error?: string; id?: string }> {
  const { visitorName, visitorEmail, visitorPhone, message, agentName, agentEmail } = data;

  try {
    if (!resend) {
      console.error('[Email] Cannot send email: Resend client not initialized (missing API key).');
      return { success: false, error: 'Email service not configured (missing API key)' };
    }

    console.log(`[Email] Sending contact email to ${agentEmail} from visitor ${visitorEmail}`);

    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: agentEmail,
      replyTo: visitorEmail,
      subject: `New Website Inquiry from ${visitorName}`,
      html: `
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
        <!-- ${visitorPhone ? `
        <tr>
          <td style="padding:7px 0;">
            <span style="display:inline-block; background:#cbd5e1; color:#475569; font-size:11px; font-weight:bold; padding:3px 8px; border-radius:4px;">PHONE</span>
          </td>
          <td style="padding:7px 0;">
            <a href="tel:${visitorPhone}" style="color:#3b82f6; text-decoration:none; font-size:14px;">${visitorPhone}</a>
          </td>
        </tr>
        ` : ''} -->
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
            `,
    });

    if (error) {
      console.error('[Email] Resend error:', error);
      return { success: false, error: error.message };
    }

    // Log to Database
    try {
      const { getDb } = await import('./db');
      const db = getDb();
      if (db) {
        await db.from('email_logs').insert({
          recipient: agentEmail,
          subject: `New Website Inquiry from ${visitorName}`,
          status: 'sent',
          resend_id: result?.id,
          created_at: new Date().toISOString()
        });
      }
    } catch (logErr) {
      console.error('[Email] Failed to log to DB:', logErr);
    }

    console.log(`[Email] Email sent successfully. ID: ${result?.id}`);
    return { success: true, id: result?.id };

  } catch (err: any) {
    console.error('[Email] Unexpected error:', err);
    // Log failure
    try {
      const { getDb } = await import('./db');
      const db = getDb();
      if (db) {
        await db.from('email_logs').insert({
          recipient: agentEmail,
          subject: `New Website Inquiry from ${visitorName}`,
          status: 'failed',
          error_message: err.message,
          created_at: new Date().toISOString()
        });
      }
    } catch (logErr) { console.error('DB Log Error', logErr) }

    return { success: false, error: err.message || 'Failed to send email' };
  }
}

interface WelcomeEmailData {
  agentName: string;
  agentEmail: string;
  websiteUrl: string;
  adminUrl: string;
  defaultPassword: string;
  leadId?: string; // Add optional leadId
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; error?: string; id?: string }> {
  const { agentName, agentEmail, websiteUrl, leadId } = data;

  try {
    // Start with a strict check
    if (!resend) {
      console.error('[Email] Resend client not initialized');
      return { success: false, error: 'Email service not configured' };
    }

    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: agentEmail,
      subject: `Question about your listings`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Question about your listings</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">

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
        Hi ${agentName},
      </p>

      <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:24px;">
        I was looking at where your listings send traffic online.
      </p>

      <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:24px;">
        When I searched your name like a buyer would, there wasn’t a clear personal site to land on, most clicks go to third-party pages.
      </p>

      <p style="font-size:16px; color:#334155; line-height:1.6; margin-bottom:32px;">
        We mocked up what buyers should see first.
      </p>

      <p style="text-align:center; margin-bottom:32px;">
        <a href="${websiteUrl}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; font-size:16px; font-weight:bold; text-decoration:none; padding:12px 24px; border-radius:8px;">
          View Preview
        </a>
      </p>

      <p style="font-size:16px; color:#334155; line-height:1.6;">
        – Team Siteo
      </p>

      <p style="font-size:14px; color:#64748b; line-height:1.6; margin-top:32px; border-top:1px solid #f1f5f9; padding-top:24px;">
        If you have any questions, email us at <a href="mailto:siteoteam@gmail.com" style="color:#4f46e5; text-decoration:none;">siteoteam@gmail.com</a>
      </p>

    </div>

    <!-- Footer -->
    <div style="background-color:#f1f5f9; padding:24px 32px; text-align:center; border-top:1px solid #e2e8f0;">
      <p style="margin:0; color:#94a3b8; font-size:11px;">
        Sent to ${agentEmail}
      </p>
    </div>

  </div>
</body>
</html>
      `
    });

    if (error) throw error; // Handle error in catch

    // Log to Database
    try {
      const { getDb } = await import('./db');
      const db = getDb();
      if (db) {
        await db.from('email_logs').insert({
          lead_id: leadId || null, // Create relationship
          recipient: agentEmail,
          subject: `Question about your listings`,
          status: 'sent',
          resend_id: result?.id,
          created_at: new Date().toISOString()
        });
      }
    } catch (logErr) {
      console.error('[Email] Failed to log to DB:', logErr);
    }

    return { success: true, id: result?.id };

  } catch (err: any) {
    // Log failure
    try {
      const { getDb } = await import('./db');
      const db = getDb();
      if (db) {
        await db.from('email_logs').insert({
          recipient: agentEmail,
          subject: `Question about your listings`,
          status: 'failed',
          error_message: err.message,
          created_at: new Date().toISOString()
        });
      }
    } catch (logErr) { }

    return { success: false, error: err.message };
  }
}

// Password Reset Email
interface PasswordResetData {
  agentName: string;
  agentEmail: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail(data: PasswordResetData): Promise<{ success: boolean; error?: string; id?: string }> {
  const { agentName, agentEmail, resetUrl } = data;

  try {
    if (!resend) {
      return { success: false, error: 'Email service not configured' };
    }

    console.log(`[Email] Sending password reset to ${agentEmail}`);

    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: agentEmail,
      subject: 'Reset Your Siteo Password',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">

  <div style="max-width:600px; margin:40px auto; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.05);">

    <!-- Header -->
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

      <p style="font-size:14px; color:#64748b; line-height:1.6;">
        If you didn't request this, you can safely ignore this email.
      </p>
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
      `
    });

    if (error) throw error;

    return { success: true, id: result?.id };

  } catch (err: any) {
    console.error('[Email] Password reset email error:', err);
    return { success: false, error: err.message };
  }
}

// Admin Access Email (sent when agent clicks welcome email)
interface AdminAccessEmailData {
  agentName: string;
  agentEmail: string;
  adminUrl: string;
  defaultPassword: string;
}

export async function sendAdminAccessEmail(data: AdminAccessEmailData): Promise<{ success: boolean; error?: string; id?: string }> {
  const { agentName, agentEmail, adminUrl, defaultPassword } = data;

  try {
    if (!resend) {
      return { success: false, error: 'Email service not configured' };
    }

    console.log(`[Email] Sending admin access email to ${agentEmail}`);

    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: agentEmail,
      subject: 'Admin access to your website',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">

  <div style="max-width:600px; margin:40px auto; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.05);">

    <!-- Header -->
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
    </div>

    <!-- Footer -->
    <div style="background-color:#f1f5f9; padding:24px 32px; text-align:center;">
      <p style="margin:0; color:#94a3b8; font-size:11px;">
        Sent to ${agentEmail}
      </p>
    </div>

  </div>

      `
    });

    if (error) throw error;

    // Log to Database
    try {
      const { getDb } = await import('./db');
      const db = getDb();
      if (db) {
        // Fetch lead by email to link it if possible, or just insert
        // CRMBoard matches via email string, so lead_id is good but nice-to-have.
        // We do a simple insert for now.
        const { data: leads } = await db.from('agent_leads').select('id').eq('primary_email', agentEmail).single();

        await db.from('email_logs').insert({
          lead_id: leads?.id || null,
          recipient: agentEmail,
          subject: 'Admin access to your website',
          status: 'sent',
          resend_id: result?.id,
          created_at: new Date().toISOString()
        });
      }
    } catch (logErr) {
      console.error('[Email] Failed to log to DB:', logErr);
    }

    return { success: true, id: result?.id };

  } catch (err: any) {
    console.error('[Email] Admin access email error:', err);

    // Log failure
    try {
      const { getDb } = await import('./db');
      const db = getDb();
      if (db) {
        await db.from('email_logs').insert({
          recipient: agentEmail,
          subject: 'Admin access to your website',
          status: 'failed',
          error_message: err.message,
          created_at: new Date().toISOString()
        });
      }
    } catch (logErr) { }

    return { success: false, error: err.message };
  }
}

// Trial Expiry Reminder Email (10 days left)
interface TrialExpiryEmailData {
  agentName: string;
  agentEmail: string;
  adminUrl: string;
  daysLeft: number;
}

export async function sendTrialExpiryReminderEmail(data: TrialExpiryEmailData): Promise<{ success: boolean; error?: string; id?: string }> {
  const { agentName, agentEmail, adminUrl, daysLeft } = data;

  try {
    if (!resend) {
      return { success: false, error: 'Email service not configured' };
    }

    console.log(`[Email] Sending trial expiry reminder to ${agentEmail} (${daysLeft} days left)`);

    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: agentEmail,
      subject: `${daysLeft} days left to keep your site active`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap" rel="stylesheet">
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">

  <div style="max-width:600px; margin:40px auto; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.05);">

    <!-- Header -->
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
      `
    });

    if (error) throw error;

    return { success: true, id: result?.id };

  } catch (err: any) {
    console.error('[Email] Trial expiry reminder error:', err);
    return { success: false, error: err.message };
  }
}

export async function sendPaymentSuccessEmail({ agentName, agentEmail, amount, date, invoiceUrl }: { agentName: string, agentEmail: string, amount: string, date: string, invoiceUrl?: string }) {
  if (!resend) return { success: false, error: 'Resend not initialized' };

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: agentEmail,
      subject: 'Payment Successful - Siteo Receipt',
      html: `
            <!DOCTYPE html>
            <html>
            <body style="font-family: sans-serif; background: #f9fafb; padding: 40px;">
                <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <h2 style="color: #4f46e5; margin-top: 0;">Payment Successful</h2>
                    <p style="color: #374151; font-size: 16px;">Hi ${agentName},</p>
                    <p style="color: #374151; font-size: 16px;">Thank you for your payment. Your subscription is active.</p>
                    
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="color: #6b7280;">Amount Paid</td>
                                <td style="text-align: right; font-weight: bold; color: #111827;">${amount}</td>
                            </tr>
                            <tr>
                                <td style="color: #6b7280;">Date</td>
                                <td style="text-align: right; font-weight: bold; color: #111827;">${date}</td>
                            </tr>
                        </table>
                    </div>

                    ${invoiceUrl ? `
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${invoiceUrl}" style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Invoice</a>
                    </div>
                    ` : ''}
                    
                    <p style="color: #9ca3af; font-size: 14px; margin-top: 40px; text-align: center;">
                        Need help? Reply to this email.
                    </p>
                </div>
            </body>
            </html>
            `
    });

    if (error) {
      console.error('[Email] Failed to send payment success email:', error);
      return { success: false, error };
    }

    return { success: true, id: data?.id };
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('[Email] Exception sending payment success email:', err);
    return { success: false, error: err.message };
  }
}

// Audit / Analysis Email
interface AuditEmailData {
  agentName: string;
  agentEmail: string;
  auditUrl: string;
  leadId?: string;
}

export async function sendAuditEmail(data: AuditEmailData): Promise<{ success: boolean; error?: string; id?: string }> {
  const { agentName, agentEmail, auditUrl, leadId } = data;

  try {
    if (!resend) {
      return { success: false, error: 'Email service not configured' };
    }

    console.log(`[Email] Sending audit report link to ${agentEmail}`);

    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: agentEmail,
      subject: `Website Report for ${agentName}`,
      html: `
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
      </p>
    </div>

  </div>

</body>
</html>
            `
    });

    if (error) throw error;

    // Log to Database
    try {
      const { getDb } = await import('./db');
      const db = getDb();
      if (db) {
        await db.from('email_logs').insert({
          lead_id: leadId || null,
          recipient: agentEmail,
          subject: `Website Report for ${agentName}`,
          status: 'sent',
          resend_id: result?.id,
          created_at: new Date().toISOString()
        });
      }
    } catch (logErr) {
      console.error('[Email] Failed to log to DB:', logErr);
    }

    return { success: true, id: result?.id };

  } catch (err: any) {
    console.error('[Email] Audit email error:', err);
    return { success: false, error: err.message };
  }
}
