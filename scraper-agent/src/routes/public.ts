import express from 'express';
import { unsubscribeLead } from '../services/db'; // Correct import

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

export const publicRoutes = router;
