import { Resend } from 'resend';
import { getContactEmailHtml } from './templates/contact';
import { getWelcomeEmailHtml } from './templates/welcome';
import { getPasswordResetEmailHtml, getAdminAccessEmailHtml, getTrialExpiryEmailHtml } from './templates/auth';
import { getPaymentSuccessEmailHtml } from './templates/payment';
import { getAuditEmailHtml } from './templates/audit';
import { getFollowup1Html, getFollowup2Html, getFollowup3Html, getFollowup4Html } from './templates/followup';
import { CLIENT_URL } from '../utils/urls'; // Ensure this exists or use process.env

// Initialize Resend client safely
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.warn('[Email] RESEND_API_KEY is not set. Email sending will be disabled.');
}
export const resend = apiKey ? new Resend(apiKey) : null;

// The "From" email must be from your verified domain
const FROM_EMAIL = 'George <george@siteo.io>';

/* ... (Contact Email and others remain valid, adding Unsubscribe mostly to "Marketing" emails like Welcome/Audit) ... */

// Helper to get unsubscribe URL
const getUnsubscribeUrl = (leadId: string) => `${CLIENT_URL}/api/public/unsubscribe/${leadId}`;

interface ContactFormData {
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  message: string;
  agentName: string;
  agentEmail: string;
}

export async function sendContactEmail(data: ContactFormData): Promise<{ success: boolean; error?: string; id?: string }> {
  // ... existing implementation (Transaction email, maybe no unsubscribe needed) ...
  const { visitorName, visitorEmail, visitorPhone, message, agentEmail } = data;

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
      html: getContactEmailHtml(visitorName, visitorEmail, visitorPhone, message)
      // Transactional: No unsubscribe header needed usually, but good practice if automated.
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
  adminUrl: string; // Kept for interface compatibility but not always used in template
  defaultPassword: string; // Kept for interface compatibility
  leadId?: string; // Made optional but we really need it for Unsubscribe
  city?: string; // Used for personalization in email body
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; error?: string; id?: string }> {
  const { agentName, agentEmail, websiteUrl, leadId, city } = data;

  try {
    // Start with a strict check
    if (!resend) {
      console.error('[Email] Resend client not initialized');
      return { success: false, error: 'Email service not configured' };
    }

    const headers: any = {};
    let htmlContent = getWelcomeEmailHtml(agentName, agentEmail, websiteUrl, undefined, city);

    // Add Unsubscribe if leadId exists
    if (leadId) {
      const unsubscribeUrl = getUnsubscribeUrl(leadId);
      headers['List-Unsubscribe'] = `<${unsubscribeUrl}>`;
      headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
      htmlContent = getWelcomeEmailHtml(agentName, agentEmail, websiteUrl, unsubscribeUrl, city);
    }

    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: agentEmail,
      replyTo: 'George@siteo.io',
      subject: `your listings`,
      html: htmlContent,
      headers: headers
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
  // Transactional - no unsubscribe needed
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
      html: getPasswordResetEmailHtml(agentName, agentEmail, resetUrl)
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
  // Transactional/Welcome - usually no unsubscribe needed for access creds
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
      html: getAdminAccessEmailHtml(agentName, agentEmail, adminUrl, defaultPassword)
    });

    if (error) throw error;

    // Log to Database
    try {
      const { getDb } = await import('./db');
      const db = getDb();
      if (db) {
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
      html: getTrialExpiryEmailHtml(agentName, agentEmail, adminUrl, daysLeft)
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
      html: getPaymentSuccessEmailHtml({ agentName, amount, date, invoiceUrl })
    });

    if (error) {
      console.error('[Email] Failed to send payment success email:', error);
      return { success: false, error };
    }

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
  city?: string;
}

export async function sendAuditEmail(data: AuditEmailData): Promise<{ success: boolean; error?: string; id?: string }> {
  const { agentName, agentEmail, auditUrl, leadId, city } = data;

  try {
    if (!resend) {
      return { success: false, error: 'Email service not configured' };
    }

    console.log(`[Email] Sending audit report link to ${agentEmail}`);

    const headers: any = {};
    let htmlContent = getAuditEmailHtml(agentName, agentEmail, auditUrl, undefined, city);

    if (leadId) {
      const unsubscribeUrl = getUnsubscribeUrl(leadId);
      headers['List-Unsubscribe'] = `<${unsubscribeUrl}>`;
      headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
      htmlContent = getAuditEmailHtml(agentName, agentEmail, auditUrl, unsubscribeUrl, city);
    }

    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: agentEmail,
      replyTo: 'George@siteo.io',
      subject: `your online presence`,
      html: htmlContent,
      headers: headers
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
          subject: `your online presence`,
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

// Follow-up Sequence Email (steps 2–5)
const FOLLOWUP_SUBJECTS: Record<number, string> = {
  2: 'still here',
  3: 'one thing i noticed',
  4: 'quick update',
  5: 'last one from me',
};

interface FollowUpEmailData {
  agentName: string;
  agentEmail: string;
  websiteUrl: string;
  leadId?: string;
  city?: string;
  step: number; // 2 | 3 | 4 | 5
}

export async function sendFollowUpEmail(data: FollowUpEmailData): Promise<{ success: boolean; error?: string; id?: string }> {
  const { agentName, agentEmail, websiteUrl, leadId, city, step } = data;

  if (!resend) return { success: false, error: 'Email service not configured' };

  try {
    const headers: any = {};
    const unsubscribeUrl = leadId ? getUnsubscribeUrl(leadId) : undefined;

    if (unsubscribeUrl) {
      headers['List-Unsubscribe'] = `<${unsubscribeUrl}>`;
      headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
    }

    const templateMap: Record<number, () => string> = {
      2: () => getFollowup1Html(agentName, agentEmail, websiteUrl, unsubscribeUrl, city),
      3: () => getFollowup2Html(agentName, agentEmail, websiteUrl, unsubscribeUrl, city),
      4: () => getFollowup3Html(agentName, agentEmail, websiteUrl, unsubscribeUrl, city),
      5: () => getFollowup4Html(agentName, agentEmail, websiteUrl, unsubscribeUrl),
    };

    const getHtml = templateMap[step];
    if (!getHtml) return { success: false, error: `Unknown sequence step: ${step}` };

    const subject = FOLLOWUP_SUBJECTS[step] || 'following up';

    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: agentEmail,
      replyTo: 'George@siteo.io',
      subject,
      html: getHtml(),
      headers,
    });

    if (error) throw error;

    // Log to DB
    try {
      const { getDb } = await import('./db');
      const db = getDb();
      if (db) {
        await db.from('email_logs').insert({
          lead_id: leadId || null,
          recipient: agentEmail,
          subject,
          status: 'sent',
          resend_id: result?.id,
          created_at: new Date().toISOString(),
        });
      }
    } catch (logErr) {
      console.error('[Email] Failed to log follow-up to DB:', logErr);
    }

    return { success: true, id: result?.id };

  } catch (err: any) {
    console.error(`[Email] Follow-up step ${step} error:`, err);
    return { success: false, error: err.message };
  }
}
