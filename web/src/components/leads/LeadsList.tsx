import { useEffect, useState } from 'react'
import { getLeads, type DBProfile } from '../../services/api'
import { adminApi } from '../../services/adminApi'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Search, Mail, Phone, MapPin, Globe, Shield, X, Loader2 } from 'lucide-react'
import { LeadDetailsModal } from './LeadDetailsModal'
import { DeleteLeadModal } from './DeleteLeadModal'

export function LeadsList() {
    const [leads, setLeads] = useState<DBProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [selectedLead, setSelectedLead] = useState<DBProfile | null>(null)
    const [sendingEmail, setSendingEmail] = useState(false)
    const [showModal, setShowModal] = useState(false)

    const [activeTab, setActiveTab] = useState<'new' | 'contacted'>('new')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const data = await getLeads()
            setLeads(data)
        } catch (err) {
            console.error(err)
            setError('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    // State for delete confirmation
    const [leadToDelete, setLeadToDelete] = useState<DBProfile | null>(null)

    const handleDeleteClick = (lead: DBProfile, e: React.MouseEvent) => {
        e.stopPropagation()
        setLeadToDelete(lead)
    }

    const handleSendWelcome = async (lead: DBProfile) => {
        if (!lead || sendingEmail) return

        // Confirmation dialog
        if (!confirm(`Send welcome email to ${lead.full_name}?`)) return

        setSendingEmail(true)
        try {
            await adminApi.notifyAgent(lead.id)
            alert(`Welcome email sent to ${lead.full_name}!`)
            // Refresh logic to update last_contacted_at locally
            setLeads(prev => prev.map(l =>
                l.id === lead.id
                    ? { ...l, last_contacted_at: new Date().toISOString() }
                    : l
            ))

        } catch (err: any) {
            alert('Failed to send email: ' + (err.message || 'Unknown error'))
        } finally {
            setSendingEmail(false)
        }
    }

    const filteredLeads = leads.filter(lead => {
        const term = searchTerm.toLowerCase()
        const matchesSearch = (
            lead.full_name?.toLowerCase().includes(term) ||
            lead.brokerage?.toLowerCase().includes(term) ||
            lead.city?.toLowerCase().includes(term)
        )

        // Tab Filter
        const isContacted = !!lead.last_contacted_at
        const matchesTab = activeTab === 'contacted' ? isContacted : !isContacted

        return matchesSearch && matchesTab
    })

    const newLeadsCount = leads.filter(l => !l.last_contacted_at).length
    const contactedLeadsCount = leads.filter(l => l.last_contacted_at).length

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-400">Loading your leads...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-sm">
                <p className="text-red-400">{error}</p>
                <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors">
                    Try Again
                </button>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-4 sm:space-y-6">
                {/* Header / Search / Toggle */}
                <div className="flex flex-col gap-3 bg-slate-900/40 p-3 sm:p-4 rounded-2xl border border-white/5 backdrop-blur-md">
                    {/* Tab Row */}
                    <div className="flex items-center gap-2 p-1 bg-slate-800/50 rounded-lg border border-white/5 w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab('new')}
                            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'new'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            My Leads
                            <span className="bg-slate-900/50 px-2 py-0.5 rounded-full text-xs">{newLeadsCount}</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('contacted')}
                            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'contacted'
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20 glow-purple'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Emailed
                            <span className="bg-slate-900/50 px-2 py-0.5 rounded-full text-xs">{contactedLeadsCount}</span>
                        </button>
                    </div>

                    {/* Actions + Search Row */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button
                            onClick={async () => {
                                if (!confirm('Send batch of 5 AUDITS to uncontacted leads?')) return;
                                try {
                                    setSendingEmail(true);
                                    const res = await adminApi.triggerBatchAudit(5);
                                    alert(`Batch Audit Complete!\nSent: ${res.stats.sent}\nFailed: ${res.stats.failed}`);
                                    fetchData();
                                } catch (err: any) {
                                    alert('Error: ' + err.message);
                                } finally {
                                    setSendingEmail(false);
                                }
                            }}
                            disabled={sendingEmail}
                            className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-medium rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                            <span className="hidden sm:inline">{sendingEmail ? 'Sending...' : 'Batch Audit'}</span>
                            <span className="sm:hidden">Audit</span>
                        </button>

                        <button
                            onClick={async () => {
                                if (!confirm('Send batch of 5 emails to uncontacted leads?')) return;
                                try {
                                    setSendingEmail(true);
                                    const res = await adminApi.triggerBatchEmail(5);
                                    alert(`Batch Complete!\nSent: ${res.stats.sent}\nFailed: ${res.stats.failed}`);
                                    fetchData();
                                } catch (err: any) {
                                    alert('Error: ' + err.message);
                                } finally {
                                    setSendingEmail(false);
                                }
                            }}
                            disabled={sendingEmail}
                            className="px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                            <span className="hidden sm:inline">{sendingEmail ? 'Sending...' : 'Send Batch'}</span>
                            <span className="sm:hidden">Batch</span>
                        </button>

                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search agents..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    {/* LEFT COLUMN: List */}
                    <div className="flex-1 w-full space-y-2 sm:space-y-3">
                        <AnimatePresence mode='popLayout'>
                            {filteredLeads.map((lead) => (
                                <motion.div
                                    key={lead.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -50, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={() => setSelectedLead(lead)}
                                    className={`group bg-slate-900/60 backdrop-blur-md border rounded-xl p-3 sm:p-4 transition-all duration-300 shadow-sm cursor-pointer ${selectedLead?.id === lead.id
                                        ? 'border-indigo-500/50 bg-indigo-500/5 shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                                        : 'border-white/5 hover:bg-slate-800/60 hover:border-indigo-500/20 hover:shadow-lg'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        {/* Avatar */}
                                        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-slate-800 rounded-full flex items-center justify-center border border-white/5 overflow-hidden">
                                            {lead.headshot_url ? (
                                                <img src={lead.headshot_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-slate-500 font-bold text-base sm:text-lg">{lead.full_name[0]}</span>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className={`font-semibold truncate text-sm sm:text-base transition-colors ${selectedLead?.id === lead.id ? 'text-indigo-400' : 'text-white group-hover:text-indigo-400'}`}>
                                                    {lead.full_name}
                                                </h3>
                                                <button
                                                    onClick={(e) => handleDeleteClick(lead, e)}
                                                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                                                    title="Delete Lead"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-xs text-slate-400 truncate">
                                                    {lead.brokerage}
                                                </p>
                                                {lead.is_unsubscribed && (
                                                    <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider flex-shrink-0">
                                                        Unsub
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                                <MapPin className="w-3 h-3" />
                                                <span className="truncate">{lead.city || 'Unknown'}, {lead.state || '—'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {filteredLeads.length === 0 && !loading && (
                            <div className="text-center py-12 bg-slate-900/30 rounded-2xl border dashed border-slate-800">
                                <p className="text-slate-500">No leads found matching your search.</p>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Action Panel (Desktop Only) */}
                    <div className="hidden lg:block w-80 shrink-0">
                        <div className="sticky top-6">
                            <AnimatePresence mode="wait">
                                {selectedLead ? (
                                    <motion.div
                                        key="selected"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4">
                                            <button onClick={() => setSelectedLead(null)} className="text-slate-500 hover:text-white transition-colors">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Profile Summary */}
                                        <div className="flex flex-col items-center text-center mb-6">
                                            <div className="w-20 h-20 rounded-full border-4 border-slate-800 shadow-lg overflow-hidden mb-3">
                                                {selectedLead.headshot_url ? (
                                                    <img src={selectedLead.headshot_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-500">
                                                        {selectedLead.full_name[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-bold text-white">{selectedLead.full_name}</h3>
                                            <p className="text-sm text-slate-400">{selectedLead.brokerage}</p>
                                        </div>

                                        {/* Actions */}
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => handleSendWelcome(selectedLead)}
                                                disabled={sendingEmail || selectedLead.is_unsubscribed}
                                                className={`w-full py-3 px-4 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${selectedLead.is_unsubscribed
                                                    ? 'bg-slate-800 text-slate-500 shadow-none'
                                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                                                    }`}
                                                title={selectedLead.is_unsubscribed ? 'User has unsubscribed' : ''}
                                            >
                                                {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                                {sendingEmail ? 'Sending...' : 'Send Welcome Email'}
                                            </button>

                                            <button
                                                onClick={async () => {
                                                    if (!selectedLead || sendingEmail) return;
                                                    if (!confirm(`Send Free Audit email to ${selectedLead.full_name}?`)) return;

                                                    setSendingEmail(true);
                                                    try {
                                                        await adminApi.sendAudit(selectedLead.id);
                                                        alert(`Audit sent to ${selectedLead.full_name}!`);

                                                        const now = new Date().toISOString();
                                                        setSelectedLead(prev => prev ? ({ ...prev, last_contacted_at: now }) : null);
                                                        setLeads(prev => prev.map(l =>
                                                            l.id === selectedLead.id
                                                                ? { ...l, last_contacted_at: now }
                                                                : l
                                                        ));
                                                    } catch (err: any) {
                                                        alert('Failed to send audit: ' + (err.message || 'Unknown error'));
                                                    } finally {
                                                        setSendingEmail(false);
                                                    }
                                                }}
                                                disabled={sendingEmail || selectedLead.is_unsubscribed}
                                                className={`w-full py-3 px-4 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${selectedLead.is_unsubscribed
                                                    ? 'bg-slate-800 text-slate-500 shadow-none'
                                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                                                    }`}
                                                title={selectedLead.is_unsubscribed ? 'User has unsubscribed' : ''}
                                            >
                                                {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                                Send Free Audit
                                            </button>

                                            <div className="grid grid-cols-2 gap-3">
                                                <a
                                                    href={selectedLead.website_config?.custom_domain
                                                        ? `https://${selectedLead.website_config.custom_domain}`
                                                        : `/w/${selectedLead.website_slug}`
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <Globe className="w-4 h-4 text-indigo-400" />
                                                    Website
                                                </a>
                                                <a
                                                    href={`/w/${selectedLead.website_slug}/admin/login`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <Shield className="w-4 h-4 text-purple-400" />
                                                    Admin
                                                </a>
                                            </div>

                                            <button
                                                onClick={() => setShowModal(true)}
                                                className="w-full py-2.5 px-4 border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white font-medium rounded-xl transition-colors text-sm"
                                            >
                                                View Full Details
                                            </button>
                                        </div>

                                        {/* Contact Info Preview */}
                                        <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
                                            <div className="flex items-center gap-3 text-sm text-slate-400">
                                                <Mail className="w-4 h-4 text-slate-600" />
                                                <span className="truncate">{selectedLead.primary_email || 'No email'}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-slate-400">
                                                <Phone className="w-4 h-4 text-slate-600" />
                                                <span className="truncate">{selectedLead.primary_phone || 'No phone'}</span>
                                            </div>
                                        </div>

                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="bg-slate-900/30 border border-slate-800/50 border-dashed rounded-2xl p-8 text-center"
                                    >
                                        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Search className="w-6 h-6 text-slate-600" />
                                        </div>
                                        <h3 className="text-slate-400 font-medium mb-1">Select an Agent</h3>
                                        <p className="text-xs text-slate-500">
                                            Click on a lead from the list to view actions and details.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* MOBILE: Full-screen overlay when a lead is selected */}
                <AnimatePresence>
                    {selectedLead && (
                        <motion.div
                            key="mobile-overlay"
                            initial={{ opacity: 0, y: '100%' }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="lg:hidden fixed inset-0 z-50 bg-slate-950 overflow-y-auto"
                        >
                            {/* Close Bar */}
                            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
                                <span className="text-sm font-medium text-slate-400">Lead Details</span>
                                <button onClick={() => setSelectedLead(null)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-5 pb-10 space-y-6">
                                {/* Profile Summary */}
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-24 h-24 rounded-full border-4 border-slate-800 shadow-lg overflow-hidden mb-3">
                                        {selectedLead.headshot_url ? (
                                            <img src={selectedLead.headshot_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-3xl font-bold text-slate-500">
                                                {selectedLead.full_name[0]}
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-white">{selectedLead.full_name}</h3>
                                    <p className="text-sm text-slate-400">{selectedLead.brokerage}</p>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                        <MapPin className="w-3 h-3" />
                                        {selectedLead.city || 'Unknown'}, {selectedLead.state || '—'}
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="bg-slate-900/60 rounded-xl p-4 space-y-3 border border-slate-800">
                                    <div className="flex items-center gap-3 text-sm text-slate-300">
                                        <Mail className="w-4 h-4 text-indigo-400" />
                                        <span className="truncate">{selectedLead.primary_email || 'No email'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-300">
                                        <Phone className="w-4 h-4 text-indigo-400" />
                                        <span className="truncate">{selectedLead.primary_phone || 'No phone'}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="space-y-3">
                                    <button
                                        onClick={() => handleSendWelcome(selectedLead)}
                                        disabled={sendingEmail || selectedLead.is_unsubscribed}
                                        className={`w-full py-3.5 px-4 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${selectedLead.is_unsubscribed
                                            ? 'bg-slate-800 text-slate-500 shadow-none'
                                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                                            }`}
                                        title={selectedLead.is_unsubscribed ? 'User has unsubscribed' : ''}
                                    >
                                        {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                        {sendingEmail ? 'Sending...' : 'Send Welcome Email'}
                                    </button>

                                    <button
                                        onClick={async () => {
                                            if (!selectedLead || sendingEmail) return;
                                            if (!confirm(`Send Free Audit email to ${selectedLead.full_name}?`)) return;

                                            setSendingEmail(true);
                                            try {
                                                await adminApi.sendAudit(selectedLead.id);
                                                alert(`Audit sent to ${selectedLead.full_name}!`);

                                                const now = new Date().toISOString();
                                                setSelectedLead(prev => prev ? ({ ...prev, last_contacted_at: now }) : null);
                                                setLeads(prev => prev.map(l =>
                                                    l.id === selectedLead.id
                                                        ? { ...l, last_contacted_at: now }
                                                        : l
                                                ));
                                            } catch (err: any) {
                                                alert('Failed to send audit: ' + (err.message || 'Unknown error'));
                                            } finally {
                                                setSendingEmail(false);
                                            }
                                        }}
                                        disabled={sendingEmail || selectedLead.is_unsubscribed}
                                        className={`w-full py-3.5 px-4 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${selectedLead.is_unsubscribed
                                            ? 'bg-slate-800 text-slate-500 shadow-none'
                                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                                            }`}
                                        title={selectedLead.is_unsubscribed ? 'User has unsubscribed' : ''}
                                    >
                                        {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                        Send Free Audit
                                    </button>

                                    <div className="grid grid-cols-2 gap-3">
                                        <a
                                            href={selectedLead.website_config?.custom_domain
                                                ? `https://${selectedLead.website_config.custom_domain}`
                                                : `/w/${selectedLead.website_slug}`
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                                        >
                                            <Globe className="w-4 h-4 text-indigo-400" />
                                            Website
                                        </a>
                                        <a
                                            href={`/w/${selectedLead.website_slug}/admin/login`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                                        >
                                            <Shield className="w-4 h-4 text-purple-400" />
                                            Admin
                                        </a>
                                    </div>

                                    <button
                                        onClick={() => setShowModal(true)}
                                        className="w-full py-3 px-4 border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white font-medium rounded-xl transition-colors text-sm"
                                    >
                                        View Full Details
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div >

            {/* Delete Confirmation Modal */}
            <DeleteLeadModal
                lead={leadToDelete}
                isOpen={!!leadToDelete}
                onClose={() => setLeadToDelete(null)}
                onDeleted={(id) => {
                    setLeads(prev => prev.filter(l => l.id !== id))
                    if (selectedLead?.id === id) setSelectedLead(null)
                    setLeadToDelete(null)
                }}
            />

            {/* Lead Details Modal - Only triggers if button clicked */}
            {selectedLead && showModal && (
                <LeadDetailsModal
                    lead={selectedLead}
                    isOpen={true}
                    onClose={() => setShowModal(false)}
                    onUpdated={fetchData}
                />
            )}
        </>
    )
}
