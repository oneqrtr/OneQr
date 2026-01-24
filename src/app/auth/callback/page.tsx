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

            // 1. Check for existing session
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('Auth callback error:', error);
                // router.push('/auth/auth-code-error'); // disable for now to see logs
                return;
            }

            if (session) {
                router.push('/admin');
                return;
            }

            // 2. Handle Implicit Flow (Hash Fragment)
            // Sometimes getSession() misses the hash update on redirect.
            // Google Login specifically returns tokens in the hash #access_token=...
            const hash = window.location.hash;
            if (hash && hash.includes('access_token')) {
                const params = new URLSearchParams(hash.substring(1)); // remove #
                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');

                if (accessToken && refreshToken) {
                    const { error: setSessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });

                    if (!setSessionError) {
                        router.push('/admin');
                        return;
                    }
                }
            }

            // 3. Fallback: Listen for Auth State Change
            // This catches cases where the client library automatically processes the hash but hasn't fired yet
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    router.push('/admin');
                }
            });

            return () => {
                subscription.unsubscribe();
            };
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
