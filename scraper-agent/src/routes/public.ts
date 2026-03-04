import express from 'express';
import { unsubscribeLead } from '../services/db'; // Correct import
import { resend } from '../services/email';

const router = express.Router();

/**
 * GET /api/public/unsubscribe/:id
 * Public endpoint for unsubscribing leads via email link
 */
router.get('/unsubscribe/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).send('Invalid request: Missing ID');
        }

        const result = await unsubscribeLead(id);

        if (result.success) {
            // Return a simple HTML success page
            res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Unsubscribed</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            background-color: #f3f4f6;
                            color: #1f2937;
                        }
                        .container {
                            background: white;
                            padding: 40px;
                            border-radius: 12px;
                            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                            text-align: center;
                            max-width: 400px;
                            width: 90%;
                        }
                        h1 { color: #059669; margin-top: 0; }
                        p { line-height: 1.5; color: #4b5563; }
                        .icon { font-size: 48px; margin-bottom: 16px; display: block; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <span class="icon">✅</span>
                        <h1>Unsubscribed</h1>
                        <p>You have been successfully removed from our mailing list.</p>
                        <p style="font-size: 0.875rem; color: #9ca3af; margin-top: 24px;">ID: ${id}</p>
                    </div>
                </body>
                </html>
            `);
        } else {
            res.status(500).send(`
                <!DOCTYPE html>
                <html>
                <body style="font-family: sans-serif; padding: 40px; text-align: center;">
                    <h1 style="color: #dc2626;">Error</h1>
                    <p>Failed to unsubscribe. Please try again or contact support.</p>
                    <p style="color: #666;">Error: ${result.error}</p>
                </body>
                </html>
            `);
        }
    } catch (err: any) {
        console.error('[Public API] Unsubscribe error:', err);
        res.status(500).send('Internal Server Error');
    }
});

/**
 * POST /api/public/intake
 * Receives website build requests from the landing page and emails them to the team
 */
router.post('/intake', async (req, res) => {
    try {
        const data = req.body;

        // Basic validation
        if (!data.fullName || !data.email || !data.businessName || !data.industry || !data.services) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const htmlBody = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">🚀 New Website Build Request</h2>
                
                <h3 style="color: #333; margin-top: 25px;">1. Client Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; width: 35%; color: #666;"><strong>Name:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.fullName}</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Email:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="mailto:${data.email}">${data.email}</a></td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Phone:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.phone || 'N/A'}</td></tr>
                </table>

                <h3 style="color: #333; margin-top: 25px;">2. Business Profile</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; width: 35%; color: #666;"><strong>Business Name:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>${data.businessName}</strong></td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Industry:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.industry}</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Current Website:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.currentWebsite ? `<a href="${data.currentWebsite}">${data.currentWebsite}</a>` : 'None'}</td></tr>
                    <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;"><strong>Social Media:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.socialMedia || 'N/A'}</td></tr>
                </table>

                <h3 style="color: #333; margin-top: 25px;">3. Project Requirements</h3>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <p style="margin: 0 0 5px 0; color: #666;"><strong>Services Offered:</strong></p>
                    <p style="margin: 0 0 15px 0;">${data.services.replace(/\n/g, '<br/>')}</p>
                    
                    <p style="margin: 0 0 5px 0; color: #666;"><strong>Target Audience:</strong></p>
                    <p style="margin: 0 0 15px 0;">${data.targetAudience || 'Not specified'}</p>
                    
                    <p style="margin: 0 0 5px 0; color: #666;"><strong>Preferred Style:</strong></p>
                    <p style="margin: 0;">${data.style ? data.style.toUpperCase() : 'Not selected'}</p>
                </div>

                ${data.notes ? `
                <div style="background: #fffbeb; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0 0 5px 0; color: #92400e;"><strong>Additional Notes:</strong></p>
                    <p style="margin: 0; color: #92400e;">${data.notes.replace(/\n/g, '<br/>')}</p>
                </div>
                ` : ''}
            </div>
        `;

        if (!resend) {
            console.warn('[Public API] ⚠️ Resend client not configured. Email not sent. Received data:', data);
            return res.json({ success: true, message: 'Request logged (Resend not configured)' });
        }

        const { data: result, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'George@siteo.io',
            to: ['siteoteam@gmail.com'],
            subject: `🚀 New Website Build Request: ${data.businessName} (${data.industry})`,
            html: htmlBody,
            replyTo: data.email
        });

        if (error) {
            console.error('[Public API] Resend sending error:', error);
            throw new Error(error.message);
        }

        console.log('[Public API] Intake email sent successfully via Resend:', result?.id);
        res.json({ success: true, message: 'Request sent successfully' });
    } catch (err: any) {
        console.error('[Public API] Intake form error:', err);
        res.status(500).json({ error: 'Failed to process request', details: err.message });
    }
});

export const publicRoutes = router;
