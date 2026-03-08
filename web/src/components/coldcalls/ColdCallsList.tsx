import { useEffect, useState } from 'react'
import { getLeads, type DBProfile, updateColdCallStatus } from '../../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Phone, PhoneCall, MapPin, Mail, X, Loader2, Save, ChevronDown, ExternalLink } from 'lucide-react'
import { ColdCallBoard, type ColdCallStage } from './ColdCallBoard'

const STAGE_OPTIONS: { id: ColdCallStage; label: string }[] = [
    { id: 'queued', label: 'Queued' },
    { id: 'called', label: 'Called' },
    { id: 'follow_up', label: 'Follow Up' },
    { id: 'interested', label: 'Interested' },
    { id: 'not_interested', label: 'Not Interested' },
    { id: 'closed', label: 'Closed' },
]

export function ColdCallsList() {
    const [leads, setLeads] = useState<DBProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [selectedLead, setSelectedLead] = useState<DBProfile | null>(null)
    const [editingNotes, setEditingNotes] = useState('')
    const [savingNotes, setSavingNotes] = useState(false)
    const [changingStatus, setChangingStatus] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const data = await getLeads()
            // Only show leads that are in the cold call pipeline
            const coldCallLeads = data.filter(l => l.cold_call_status)
            setLeads(coldCallLeads)
            // Update selected lead if it exists
            if (selectedLead) {
                const updated = coldCallLeads.find(l => l.id === selectedLead.id)
                setSelectedLead(updated || null)
            }
        } catch (err) {
            console.error(err)
            setError('Failed to load cold calls')
        } finally {
            setLoading(false)
        }
    }

    const filteredLeads = leads.filter(lead => {
        const term = searchTerm.toLowerCase()
        return (
            lead.full_name?.toLowerCase().includes(term) ||
            lead.brokerage?.toLowerCase().includes(term) ||
            lead.city?.toLowerCase().includes(term) ||
            lead.primary_phone?.includes(term)
        )
    })

    const handleSaveNotes = async () => {
        if (!selectedLead || savingNotes) return
        setSavingNotes(true)
        try {
            await updateColdCallStatus(selectedLead.id, selectedLead.cold_call_status || 'queued', editingNotes)
            setLeads(prev => prev.map(l =>
                l.id === selectedLead.id
                    ? { ...l, cold_call_notes: editingNotes, cold_call_date: new Date().toISOString() }
                    : l
            ))
            setSelectedLead(prev => prev ? { ...prev, cold_call_notes: editingNotes, cold_call_date: new Date().toISOString() } : null)
        } catch (err: any) {
            alert('Failed to save notes: ' + err.message)
        } finally {
            setSavingNotes(false)
        }
    }

    const handleChangeStatus = async (newStatus: ColdCallStage) => {
        if (!selectedLead || changingStatus) return
        setChangingStatus(true)
        try {
            await updateColdCallStatus(selectedLead.id, newStatus)
            setLeads(prev => prev.map(l =>
                l.id === selectedLead.id
                    ? { ...l, cold_call_status: newStatus, cold_call_date: new Date().toISOString() }
                    : l
            ))
            setSelectedLead(prev => prev ? { ...prev, cold_call_status: newStatus, cold_call_date: new Date().toISOString() } : null)
        } catch (err: any) {
            alert('Failed to change status: ' + err.message)
        } finally {
            setChangingStatus(false)
        }
    }

    const handleRemoveFromPipeline = async () => {
        if (!selectedLead) return
        if (!confirm(`Remove ${selectedLead.full_name} from the cold calls pipeline?`)) return
        try {
            await updateColdCallStatus(selectedLead.id, '')
            setLeads(prev => prev.filter(l => l.id !== selectedLead.id))
            setSelectedLead(null)
        } catch (err: any) {
            alert('Failed to remove: ' + err.message)
        }
    }

    const handleSelectLead = (lead: DBProfile) => {
        setSelectedLead(lead)
        setEditingNotes(lead.cold_call_notes || '')
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-400">Loading cold calls...</p>
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
                {/* Header / Search */}
                <div className="flex flex-col gap-3 bg-slate-900/40 p-3 sm:p-4 rounded-2xl border border-white/5 backdrop-blur-md">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {/* Stats */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <Phone className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-medium text-amber-400">{leads.length} Cold Calls</span>
                        </div>

                        {/* Search */}
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, phone, city..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Board + Sidebar Layout */}
                <div className="flex flex-col lg:flex-row gap-4 items-start overflow-hidden">
                    {/* Main Board */}
                    <div className="flex-1 w-full min-w-0 overflow-hidden">
                        <ColdCallBoard
                            leads={filteredLeads}
                            onSelectLead={handleSelectLead}
                            loading={loading}
                            onLeadUpdated={fetchData}
                        />
                    </div>

                    {/* RIGHT COLUMN: Action Panel (Desktop) */}
                    <div className="hidden lg:block w-80 xl:w-96 shrink-0">
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

                                        {/* Profile */}
                                        <div className="flex flex-col items-center text-center mb-5">
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
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                                <MapPin className="w-3 h-3" />
                                                {selectedLead.city || 'Unknown'}, {selectedLead.state || '—'}
                                            </div>
                                        </div>

                                        {/* Phone - Click to Call */}
                                        {selectedLead.primary_phone && (
                                            <a
                                                href={`tel:${selectedLead.primary_phone}`}
                                                className="w-full mb-3 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                                            >
                                                <PhoneCall className="w-5 h-5" />
                                                {selectedLead.primary_phone}
                                            </a>
                                        )}

                                        {/* View Original Profile */}
                                        {selectedLead.source_url && (
                                            <a
                                                href={selectedLead.source_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full mb-4 py-2.5 px-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-medium rounded-xl border border-indigo-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                View Original Profile
                                            </a>
                                        )}

                                        {/* Status Changer */}
                                        <div className="mb-4">
                                            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Status</label>
                                            <div className="relative">
                                                <select
                                                    value={selectedLead.cold_call_status || 'queued'}
                                                    onChange={(e) => handleChangeStatus(e.target.value as ColdCallStage)}
                                                    disabled={changingStatus}
                                                    className="w-full appearance-none bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50 cursor-pointer"
                                                >
                                                    {STAGE_OPTIONS.map(s => (
                                                        <option key={s.id} value={s.id}>{s.label}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                            </div>
                                        </div>

                                        {/* Call Notes */}
                                        <div className="mb-4">
                                            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Call Notes</label>
                                            <textarea
                                                value={editingNotes}
                                                onChange={(e) => setEditingNotes(e.target.value)}
                                                placeholder="Add notes about the call..."
                                                rows={4}
                                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none placeholder-slate-500"
                                            />
                                            <button
                                                onClick={handleSaveNotes}
                                                disabled={savingNotes || editingNotes === (selectedLead.cold_call_notes || '')}
                                                className="mt-2 w-full py-2 px-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:cursor-not-allowed"
                                            >
                                                {savingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                {savingNotes ? 'Saving...' : 'Save Notes'}
                                            </button>
                                        </div>

                                        {/* Contact Info */}
                                        <div className="pt-4 border-t border-slate-800 space-y-3">
                                            <div className="flex items-center gap-3 text-sm text-slate-400">
                                                <Mail className="w-4 h-4 text-slate-600" />
                                                <span className="truncate">{selectedLead.primary_email || 'No email'}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-slate-400">
                                                <Phone className="w-4 h-4 text-slate-600" />
                                                <span className="truncate">{selectedLead.primary_phone || 'No phone'}</span>
                                            </div>
                                        </div>

                                        {/* Remove from Pipeline */}
                                        <button
                                            onClick={handleRemoveFromPipeline}
                                            className="mt-4 w-full py-2 px-4 border border-red-500/20 hover:bg-red-500/10 text-red-400 font-medium rounded-xl transition-colors text-sm"
                                        >
                                            Remove from Cold Calls
                                        </button>
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
                                            <Phone className="w-6 h-6 text-slate-600" />
                                        </div>
                                        <h3 className="text-slate-400 font-medium mb-1">Select a Lead</h3>
                                        <p className="text-xs text-slate-500">
                                            Click on a card to view details, update status, and add call notes.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* MOBILE: Full-screen overlay */}
                <AnimatePresence>
                    {selectedLead && (
                        <motion.div
                            key="mobile-overlay"
                            initial={{ opacity: 0, y: '100%' }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="lg:hidden fixed inset-0 z-[100] h-[100dvh] bg-slate-950 overflow-y-auto"
                        >
                            {/* Close Bar */}
                            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
                                <span className="text-sm font-medium text-slate-400">Cold Call Details</span>
                                <button onClick={() => setSelectedLead(null)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-5 pb-10 space-y-5">
                                {/* Profile */}
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

                                {/* Phone */}
                                {selectedLead.primary_phone && (
                                    <a
                                        href={`tel:${selectedLead.primary_phone}`}
                                        className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <PhoneCall className="w-5 h-5" />
                                        {selectedLead.primary_phone}
                                    </a>
                                )}

                                {/* View Original Profile */}
                                {selectedLead.source_url && (
                                    <a
                                        href={selectedLead.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-3 px-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-medium rounded-xl border border-indigo-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        View Original Profile
                                    </a>
                                )}

                                {/* Status */}
                                <div>
                                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Status</label>
                                    <div className="relative">
                                        <select
                                            value={selectedLead.cold_call_status || 'queued'}
                                            onChange={(e) => handleChangeStatus(e.target.value as ColdCallStage)}
                                            disabled={changingStatus}
                                            className="w-full appearance-none bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
                                        >
                                            {STAGE_OPTIONS.map(s => (
                                                <option key={s.id} value={s.id}>{s.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Call Notes</label>
                                    <textarea
                                        value={editingNotes}
                                        onChange={(e) => setEditingNotes(e.target.value)}
                                        placeholder="Add notes about the call..."
                                        rows={5}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none placeholder-slate-500"
                                    />
                                    <button
                                        onClick={handleSaveNotes}
                                        disabled={savingNotes || editingNotes === (selectedLead.cold_call_notes || '')}
                                        className="mt-2 w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:cursor-not-allowed"
                                    >
                                        {savingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {savingNotes ? 'Saving...' : 'Save Notes'}
                                    </button>
                                </div>

                                {/* Contact Info */}
                                <div className="bg-slate-900/60 rounded-xl p-4 space-y-3 border border-slate-800">
                                    <div className="flex items-center gap-3 text-sm text-slate-300">
                                        <Mail className="w-4 h-4 text-amber-400" />
                                        <span className="truncate">{selectedLead.primary_email || 'No email'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-300">
                                        <Phone className="w-4 h-4 text-amber-400" />
                                        <span className="truncate">{selectedLead.primary_phone || 'No phone'}</span>
                                    </div>
                                </div>

                                {/* Remove */}
                                <button
                                    onClick={handleRemoveFromPipeline}
                                    className="w-full py-3 px-4 border border-red-500/20 hover:bg-red-500/10 text-red-400 font-medium rounded-xl transition-colors text-sm"
                                >
                                    Remove from Cold Calls
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    )
}
