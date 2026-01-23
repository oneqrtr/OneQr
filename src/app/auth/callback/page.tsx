'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const handleAuthCallback = async () => {
            const supabase = createClient();

            // Check for hash parameters (Implicit flow / Magic Link)
            // Supabase client automatically handles checking the URL for us in many cases,
            // but we can explicitly call getSession to finalize

            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('Auth callback error:', error);
                router.push('/auth/auth-code-error');
                return;
            }

            if (session) {
                // Successful login
                // Check if restaurant exists to decide where to go
                // For now, default to admin, let admin layout redirect if needed
                router.push('/admin');
            } else {
                // Try parsing hash manually if getSession didn't pick it up immediately 
                // (though supabase-js usually does on init if autoRefreshToken is on)

                // If no session found and no error, maybe it's just a direct visit?
                // But typically after redirect, getSession should have it.
                // Listen for auth state change
                const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                    if (event === 'SIGNED_IN' && session) {
                        router.push('/admin');
                    }
                });

                return () => {
                    subscription.unsubscribe();
                };
            }
        };

        handleAuthCallback();
    }, [router]);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{ marginBottom: '20px' }}>
                {/* Spinner */}
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #F3F4F6',
                    borderTop: '4px solid #2563EB',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <style jsx>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
            <p style={{ color: '#6B7280' }}>Giriş yapılıyor, lütfen bekleyin...</p>
        </div>
    );
}
