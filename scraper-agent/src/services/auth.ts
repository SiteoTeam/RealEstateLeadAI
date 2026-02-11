
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from './db';

const _jwtSecret = process.env.JWT_SECRET;
if (!_jwtSecret) {
    console.error('FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.');
    process.exit(1);
}
const JWT_SECRET: string = _jwtSecret;
const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = process.env.DEFAULT_AGENT_PASSWORD || 'changeme'; // Set in .env for security

// 1. Password Hashing
export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

// 2. Token Generation
export function generateToken(agentId: string, slug: string): string {
    return jwt.sign({ agentId, slug, role: 'agent' }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): any {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}

// Reset Token Generation (1 hour expiry)
export function generateResetToken(agentId: string, slug: string): string {
    return jwt.sign({ agentId, slug, purpose: 'password_reset' }, JWT_SECRET, { expiresIn: '1h' });
}

export function verifyResetToken(token: string): { agentId: string; slug: string } | null {
    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        if (payload.purpose !== 'password_reset') return null;
        return { agentId: payload.agentId, slug: payload.slug };
    } catch (err) {
        return null;
    }
}

// 3. Seeding / Migration Helper
// Call this on server start to ensure all agents have a password
export async function seedDefaultPasswords() {
    const client = getDb();
    if (!client) {
        console.warn('[Auth] Database not ready, skipping seed.');
        return;
    }

    try {
        // Find agents with NULL password_hash
        const { data: agents, error } = await client
            .from('scraped_agents')
            .select('id, full_name')
            .is('password_hash', null);

        if (error) {
            console.error('[Auth] Error checking for unseeded agents:', error);
            return;
        }

        if (!agents || agents.length === 0) {
            console.log('[Auth] All agents have password hashes.');
            return;
        }

        console.log(`[Auth] Seeding default password for ${agents.length} agents...`);
        const defaultHash = await hashPassword(DEFAULT_PASSWORD);

        // Update all of them (one by one or bulk if possible, Supabase bulk update usually requires upsert with all fields, so one by one is safer for partial update)
        // Actually, we can do a bulk update logic if we just updating one field for all rows? 
        // No, Supabase update().is('password_hash', null) works for bulk!

        const { error: updateError, count } = await client
            .from('scraped_agents')
            .update({ password_hash: defaultHash })
            .is('password_hash', null)
            .select('id');

        if (updateError) {
            console.error('[Auth] Error bulk seeding passwords:', updateError);
        } else {
            console.log(`[Auth] Successfully seeded default passwords for ${count} agents.`);
        }

    } catch (err) {
        console.error('[Auth] Seeding error:', err);
    }
}
