

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
import { getAuthHeaders } from '../utils/auth'


export const adminApi = {
    // Agent Login (New System)
    login: async (slug: string, password: string) => {
        const response = await fetch(`${API_BASE}/api/agent/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, password }),
        })

        if (!response.ok) {
            const data = await response.json().catch(() => ({ error: 'Login failed' }))
            throw new Error(data.error || 'Login failed')
        }

        return response.json()
    },

    forgotPassword: async (slug: string) => {
        const response = await fetch(`${API_BASE}/api/agent/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug }),
        })

        if (!response.ok) {
            const data = await response.json().catch(() => ({ error: 'Request failed' }))
            throw new Error(data.error || 'Request failed')
        }

        return response.json()
    },

    resetPassword: async (token: string, newPassword: string) => {
        const response = await fetch(`${API_BASE}/api/agent/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword }),
        })

        if (!response.ok) {
            const data = await response.json().catch(() => ({ error: 'Reset failed' }))
            throw new Error(data.error || 'Reset failed')
        }

        return response.json()
    },

    changePassword: async (newPassword: string, token: string) => {
        const response = await fetch(`${API_BASE}/api/agent/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ newPassword }),
        })

        if (!response.ok) {
            const data = await response.json().catch(() => ({ error: 'Failed to update password' }))
            throw new Error(data.error || 'Failed to update password')
        }

        return response.json()
    },

    getConfig: async (id: string) => {
        const response = await fetch(`${API_BASE}/api/admin/config/${id}`, {
            headers: getAuthHeaders(),
        })

        if (!response.ok) throw new Error('Failed to fetch config')
        return response.json()
    },

    updateConfig: async (id: string, config: any, token?: string) => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : getAuthHeaders())
        }

        // If using token, we might not have ID, or we might use the endpoint differently?
        // Actually, for the Agent Dashboard, we might need a specific endpoint or just allow this one to work?
        // The backend `verifySupabaseUser` middleware expects Supabase stuff.
        // We need to restore the Agent-Token compatible middleware or endpoint.
        // For now, let's assume the backend will accept the token relative to the ID.

        const response = await fetch(`${API_BASE}/api/admin/config/${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(config),
        })

        if (!response.ok) throw new Error('Failed to update config')
        return response.json()
    },

    uploadImage: async (slug: string, file: File) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`${API_BASE}/api/admin/upload/${slug}`, {
            method: 'POST',
            headers: getAuthHeaders(), // No Content-Type for FormData
            body: formData,
        })

        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            throw new Error(err.error || 'Failed to upload image')
        }
        return response.json()
    },

    // --- Domain Management ---
    addDomain: async (domain: string, token?: string) => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : getAuthHeaders())
        }

        const response = await fetch(`${API_BASE}/api/admin/domains`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ domain }),
        })

        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            const error: any = new Error(err.message || err.error?.message || 'Failed to add domain')
            error.details = err.details || err;
            throw error
        }
        return response.json()
    },

    getDomainStatus: async (domain: string, token?: string) => {
        const headers: Record<string, string> = {
            ...(token ? { 'Authorization': `Bearer ${token}` } : getAuthHeaders())
        }

        try {
            const response = await fetch(`${API_BASE}/api/admin/domains/${domain}`, {
                headers,
            })

            if (!response.ok) {
                return null // Return null for ANY failure
            }
            return response.json()
        } catch (err) {
            console.error('[adminApi] getDomainStatus network error:', err)
            return null
        }
    },

    verifyDomain: async (domain: string, token?: string) => {
        const headers: Record<string, string> = {
            ...(token ? { 'Authorization': `Bearer ${token}` } : getAuthHeaders())
        }

        const response = await fetch(`${API_BASE}/api/admin/domains/${domain}/verify`, {
            method: 'POST',
            headers,
        })

        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            const error: any = new Error(err.message || err.error || 'Failed to verify domain')
            error.details = err.details || err
            throw error
        }
        return response.json()
    },

    removeDomain: async (domain: string, token?: string) => {
        const headers: Record<string, string> = {
            ...(token ? { 'Authorization': `Bearer ${token}` } : getAuthHeaders())
        }

        const response = await fetch(`${API_BASE}/api/admin/domains/${domain}`, {
            method: 'DELETE',
            headers,
        })

        if (!response.ok) throw new Error('Failed to remove domain')
        return response.json()
    },

    notifyAgent: async (id: string, token?: string) => {
        const headers: Record<string, string> = {
            ...(token ? { 'Authorization': `Bearer ${token}` } : getAuthHeaders())
        }

        const response = await fetch(`${API_BASE}/api/admin/notify-agent/${id}`, {
            method: 'POST',
            headers,
        })

        if (!response.ok) {
            const text = await response.text();
            let err: any = {};
            try {
                err = JSON.parse(text);
            } catch (e) {
                // If not JSON, use the raw text as error if short, or status text
                const errMsg = text.length > 100 ? text.substring(0, 100) + '...' : text;
                err = { error: `Server Error (${response.status}): ${errMsg}` };
            }
            throw new Error(err.message || err.error || `Request failed: ${response.status} ${response.statusText}`)
        }
        return response.json()
    },

    triggerBatchEmail: async (batchSize: number = 5, token?: string) => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : getAuthHeaders())
        }

        const response = await fetch(`${API_BASE}/api/admin/trigger-batch`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ batchSize }),
        })

        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            throw new Error(err.message || err.error || 'Failed to trigger batch email')
        }
        return response.json()
    },

    // Audit Feature
    sendAudit: async (leadId: string, token?: string) => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : getAuthHeaders())
        }

        const response = await fetch(`${API_BASE}/api/audit/create`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ leadId }),
        })

        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            throw new Error(err.message || err.error || 'Failed to send audit')
        }
        return response.json()
    },

    // Log Access (for analytics/tracking)
    logAccess: async (token: string, source: string) => {
        try {
            await fetch(`${API_BASE}/api/agent/log-access`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ source }),
            })
        } catch (err) {
            // Silently fail - analytics only
            console.error('Failed to log access', err)
        }
    }
}
