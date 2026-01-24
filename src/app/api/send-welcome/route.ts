
import { WelcomeEmailTemplate } from '@/components/emails/WelcomeEmail';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with API Key from environment variables
// IMPORTANT: User needs to add RESEND_API_KEY to .env.local
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { email, businessName } = await request.json();
        console.log('Attempting to send welcome email to:', email);

        if (!process.env.RESEND_API_KEY) {
            console.error('RESEND_API_KEY is missing in environment variables!');
            return NextResponse.json({ success: false, message: 'API Key missing' }, { status: 500 }); // Return 500 to signal error
        }

        // Send Email
        const { data, error } = await resend.emails.send({
            from: 'OneQR <noreply@oneqr.tr>', // Sender: Requires 'oneqr.tr' (root domain) verification in Resend
            to: [email],
            subject: 'OneQR Ailesine Hoş Geldiniz! 🚀',
            // @ts-ignore - React Email component is valid here
            react: WelcomeEmailTemplate({ businessName: businessName }),
        });

        if (error) {
            console.error('Resend API Error:', error);
            // Explicitly return message because Error objects often stringify to {}
            const errorMessage = error.message || 'Unknown Resend Error';
            return NextResponse.json({ error: errorMessage, type: error.name }, { status: 500 });
        }

        console.log('Email sent successfully:', data);
        return NextResponse.json({ data });
    } catch (error) {
        console.error('Unexpected API Error:', error);
        return NextResponse.json({ error }, { status: 500 });
    }
}
