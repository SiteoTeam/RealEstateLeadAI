import { useState, useEffect, useCallback } from 'react'
import {
    RefreshCw,
    XCircle
} from 'lucide-react'
import { LeadDetailsModal } from '../leads/LeadDetailsModal'
import { CRMBoard } from '../leads/CRMBoard'
import { getLeads, deleteEmailLogs, type DBProfile } from '../../services/api'
import type { EmailLog } from '../../types/email'

// Types based on Resend API response


export function EmailLogs() {
    const [logs, setLogs] = useState<EmailLog[]>([])
    const [leads, setLeads] = useState<DBProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedLead, setSelectedLead] = useState<DBProfile | null>(null)
    const [showModal, setShowModal] = useState(false)



    // Simplified stable fetchData for interval
    const fetchData = useCallback(async () => {
        try {
            const token = localStorage.getItem('sb-jqtrgdmjosegilmbxino-auth-token')
            let headers = {}
            if (token) {
                const session = JSON.parse(token)
                headers = { 'Authorization': `Bearer ${session.access_token}` }
            }

            const [logsResponse, leadsData] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/api/admin/emails`, { headers }),
                getLeads()
            ])

            if (!logsResponse.ok) throw new Error('Failed to fetch logs')

            const logsJson = await logsResponse.json()
            const logsData = (logsJson.data && Array.isArray(logsJson.data)) ? logsJson.data : (Array.isArray(logsJson) ? logsJson : [])

            setLogs(logsData)
            setLeads(leadsData)
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Failed to load data')
        }
    }, [])

    // Initial load + smart polling (only when tab is visible)
    useEffect(() => {
        setLoading(true)
        fetchData().finally(() => setLoading(false))

        let interval: ReturnType<typeof setInterval> | null = null

        const startPolling = () => {
            if (!interval) interval = setInterval(fetchData, 30000)
        }
        const stopPolling = () => {
            if (interval) { clearInterval(interval); interval = null }
        }

        const onVisibilityChange = () => {
            if (document.hidden) {
                stopPolling()
            } else {
                fetchData() // refresh immediately when tab becomes visible
                startPolling()
            }
        }

        startPolling()
        document.addEventListener('visibilitychange', onVisibilityChange)

        return () => {
            stopPolling()
            document.removeEventListener('visibilitychange', onVisibilityChange)
        }
    }, [fetchData])


    // Generate ghost leads for emails that don't match existing leads
    const activeLeads = [...leads]

    // Create a Set of normalized existing emails for fast lookup
    const existingEmails = new Set(
        leads.map(l => l.primary_email ? l.primary_email.trim().toLowerCase() : '')
    )

    // Track added ghost emails to prevent duplicates in the ghost list itself
    const addedGhostEmails = new Set<string>()

    logs.forEach(log => {
        // Handle recipient from log.recipient OR log.to array
        let recipient = log.recipient
        if (!recipient && log.to) {
            if (Array.isArray(log.to)) recipient = log.to[0]
            else recipient = log.to as string
        }

        const normalizedRecipient = recipient ? recipient.trim().toLowerCase() : ''

        if (normalizedRecipient && !existingEmails.has(normalizedRecipient) && !addedGhostEmails.has(normalizedRecipient)) {
            addedGhostEmails.add(normalizedRecipient)
            // Create a temporary ghost lead
            activeLeads.push({
                id: `ghost-${normalizedRecipient}`,
                full_name: normalizedRecipient.split('@')[0], // Use email prefix as name
                primary_email: normalizedRecipient,
                created_at: log.created_at,
                is_paid: false,
                // Add required fields with defaults
                city: '',
                state: '',
                brokerage: 'Email Contact',
                headshot_url: null,
                phone_numbers: [],
                social_media: {},
                website_config: {},
                user_id: ''
            } as any)
        }
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Email Campaign</h2>
                    <p className="text-sm text-slate-500">Track deliverability and manage lead pipeline. Auto-refreshes every 30s.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setLoading(true); fetchData().finally(() => setLoading(false)); }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Button Removed: Moved to CRMBoard/Leads Section */}
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Error loading data: {error}
                </div>
            )}

            {/* Full Width Breakout Container */}
            <div className="w-screen relative left-1/2 -translate-x-1/2 bg-slate-950/50 border-y border-slate-800/50 backdrop-blur-sm px-4 sm:px-6 lg:px-8 py-8">
                <CRMBoard
                    leads={activeLeads}
                    emailLogs={logs}
                    onSelectLead={(lead) => {
                        // Only open modal for real leads
                        if (!lead.id.startsWith('ghost-')) {
                            setSelectedLead(lead)
                            setShowModal(true)
                        }
                    }}
                    loading={loading}
                    onLeadDeleted={async (id) => {
                        // For ghost leads, delete email logs by recipient
                        if (id.startsWith('ghost-')) {
                            const email = id.replace('ghost-', '')
                            try {
                                await deleteEmailLogs(email)
                                // Refresh data to remove deleted logs
                                fetchData()
                            } catch (err) {
                                console.error('Failed to delete email logs:', err)
                            }
                        } else {
                            // For real leads, just refresh data
                            fetchData()
                        }
                    }}
                    onRefresh={fetchData}
                />
            </div>

            {selectedLead && showModal && (
                <LeadDetailsModal
                    lead={selectedLead}
                    isOpen={true}
                    onClose={() => setShowModal(false)}
                    onUpdated={() => fetchData()}
                />
            )}
        </div>
    )
}
