/**
 * Helper to get Auth Headers
 */
export const getAuthHeaders = (): Record<string, string> => {
    // Get the session from local storage (Supabase default)
    // We scan for the key that starts with 'sb-' and ends with '-auth-token'
    const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
    if (!key) return {}

    try {
        const session = JSON.parse(localStorage.getItem(key) || '{}')
        if (session.access_token) {
            return { 'Authorization': `Bearer ${session.access_token}` }
        }
    } catch (e) {
        console.error('Error parsing auth token', e)
    }
    return {}
}
