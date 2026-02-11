/**
 * Resend Email Service
 * 
 * Handles sending contact form emails via Resend.
 */

import { Resend } from 'resend';
import { getContactEmailHtml } from './templates/contact';
import { getWelcomeEmailHtml } from './templates/welcome';
import { getPasswordResetEmailHtml, getAdminAccessEmailHtml, getTrialExpiryEmailHtml } from './templates/auth';
import { getPaymentSuccessEmailHtml } from './templates/payment';
import { getAuditEmailHtml } from './templates/audit';

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
      html: getContactEmailHtml(visitorName, visitorEmail, visitorPhone, message)
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
      html: getWelcomeEmailHtml(agentName, agentEmail, websiteUrl)
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
      html: getAuditEmailHtml(agentName, agentEmail, auditUrl)
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
