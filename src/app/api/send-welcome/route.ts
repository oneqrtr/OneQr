
import { WelcomeEmailTemplate } from '@/components/emails/WelcomeEmail';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with API Key from environment variables
// IMPORTANT: User needs to add RESEND_API_KEY to .env.local
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { email, businessName } = await request.json();

        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY is not set. Email skipping.');
            return NextResponse.json({ success: false, message: 'API Key missing' }, { status: 200 });
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
            console.error('Email Send Error:', error);
            return NextResponse.json({ error });
        }

        return NextResponse.json({ data });
    } catch (error) {
        return NextResponse.json({ error });
    }
}
