'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const handleAuthCallback = async () => {
            const supabase = createClient();

            // Helper to decide where to go
            const checkAndRedirect = async (userId: string) => {
                try {
                    const { data } = await supabase
                        .from('restaurants')
                        .select('id')
                        .eq('owner_id', userId)
                        .maybeSingle();

                    if (data) {
                        window.location.href = '/admin';
                    } else {
                        window.location.href = '/onboarding';
                    }
                } catch (e) {
                    console.error('Redirect Logic Error:', e);
                    // Fallback
                    window.location.href = '/admin';
                }
            };

            // 1. PRIORITY: Handle Implicit Flow (Hash Fragment) from Google
            // Google OAuth redirects often come with #access_token=...&... which needs to be parsed manually 
            // if we are not using the standard PKCE helper from Supabase properly in this context.
            const hash = window.location.hash;
            // Also check query params just in case
            const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

            if (hash && hash.includes('access_token')) {
                try {
                    // Remove the leading #
                    const hashString = hash.substring(1);
                    const params = new URLSearchParams(hashString);
                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');
                    const type = params.get('type');

                    if (accessToken) {
                        // Sometimes implicit flow only returns access_token
                        // If we have refresh_token, great. If not, try setting session with what we have.
                        const sessionParams: any = {
                            access_token: accessToken,
                            refresh_token: refreshToken || '', // Supabase might require this or handle empty string
                        };

                        const { data, error } = await supabase.auth.setSession(sessionParams);

                        if (!error && data.session) {
                            await checkAndRedirect(data.session.user.id);
                            return;
                        }
                    }
                } catch (hashError) {
                    console.error('Hash Parsing Error:', hashError);
                }
            } else if (searchParams && searchParams.has('code')) {
                // Handle standard PKCE code exchange if present in query
                // The Supabase client generally handles this automatically if configured, 
                // but we can ensure here.
                // Actually for client-side only, usually it auto-detects.
                // We will let the getSession below handle it if the code was exchanged.
            }
            // We will let the getSession below handle it if the code was exchanged.
        }

        // 2. Check for existing session (if implicit flow didn't happen or failed)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!error && session) {
            await checkAndRedirect(session.user.id);
            return;
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
