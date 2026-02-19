import { cookies } from 'next/headers';
import crypto from 'crypto';

const COOKIE_NAME = 'garson_sess';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;
const SECRET = process.env.GARSON_COOKIE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'garson-secret';

export type GarsonSession = { slug: string; exp: number };

function sign(payload: string): string {
    return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
}

export function createGarsonCookie(slug: string): string {
    const payload = JSON.stringify({ slug, exp: Date.now() + COOKIE_MAX_AGE * 1000 });
    const encoded = Buffer.from(payload).toString('base64url');
    const sig = sign(encoded);
    return `${sig}.${encoded}`;
}

export async function getGarsonSession(slug: string): Promise<GarsonSession | null> {
    const cookieStore = await cookies();
    const raw = cookieStore.get(COOKIE_NAME)?.value;
    if (!raw) return null;
    const dot = raw.indexOf('.');
    if (dot === -1) return null;
    const sig = raw.slice(0, dot);
    const encoded = raw.slice(dot + 1);
    if (sign(encoded) !== sig) return null;
    try {
        const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString());
        if (payload.slug !== slug || payload.exp < Date.now()) return null;
        return payload;
    } catch {
        return null;
    }
}
