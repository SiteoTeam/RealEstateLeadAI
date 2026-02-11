
export const getPaymentSuccessEmailHtml = ({
    agentName,
    amount,
    date,
    invoiceUrl
}: {
    agentName: string;
    amount: string;
    date: string;
    invoiceUrl?: string;
}) => `
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
`;
