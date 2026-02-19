import { createClient as createSupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

export const createClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL and Key must be defined in .env.local');
    }

    // Server-side: always create new instance
    if (typeof window === 'undefined') {
        return createSupabaseClient(supabaseUrl, supabaseKey);
    }

    // Client-side: check for singleton
    if (!supabaseInstance) {
        supabaseInstance = createSupabaseClient(supabaseUrl, supabaseKey);
    }

    return supabaseInstance;
};

/** Server-only: bypasses RLS. Use for garson API and other trusted server actions. */
export function createServiceClient() {
    if (typeof window !== 'undefined') throw new Error('createServiceClient is only for server');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY required for service client');
    return createSupabaseClient(url, key);
}
