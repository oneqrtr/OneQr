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

            // Helper to decide where to go
            const checkAndRedirect = async (userId: string) => {
                const { data } = await supabase
                    .from('restaurants')
                    .select('id')
                    .eq('owner_id', userId)
                    .maybeSingle();

                if (data) {
                    router.push('/admin');
                } else {
                    router.push('/onboarding');
                }
            };

            // 1. Check for existing session
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('Auth callback error:', error);
                return;
            }

            if (session) {
                await checkAndRedirect(session.user.id);
                return;
            }

            // 2. Handle Implicit Flow (Hash Fragment)
            const hash = window.location.hash;
            if (hash && hash.includes('access_token')) {
                const params = new URLSearchParams(hash.substring(1));
                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');

                if (accessToken && refreshToken) {
                    const { data: { user }, error: setSessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });

                    if (!setSessionError && user) {
                        await checkAndRedirect(user.id);
                        return;
                    }
                }
            }

            // 3. Fallback: Listen for Auth State Change
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    await checkAndRedirect(session.user.id);
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
