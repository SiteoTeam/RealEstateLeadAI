import { type DBProfile, pruneExpiredLeads, markAsColdCall } from '../../services/api'
import type { EmailLog } from '../../types/email'
import {
    CheckCircle,
    Eye,
    MousePointerClick,
    Globe,
    DollarSign,
    Ban,
    ExternalLink,
    Mail,
    Trash2,
    LogIn,
    PhoneCall,
    ChevronDown,
    ChevronUp
} from 'lucide-react'
import { DeleteLeadModal } from './DeleteLeadModal'
import { useState, useMemo } from 'react'
import { getStage, getSortedLeadLogs, type Stage } from '../../utils/crmStageLogic'

const CARDS_LIMIT = 15

interface CRMBoardProps {
    leads: DBProfile[]
    emailLogs: EmailLog[]
    onSelectLead: (lead: DBProfile) => void
    loading: boolean
    onLeadDeleted?: (id: string) => void
    onRefresh?: () => void
}

const STAGES: { id: Stage; label: string; icon: any; color: string; bg: string }[] = [
    { id: 'Delivered', label: 'Delivered', icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'Opened', label: 'Opened', icon: Eye, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { id: 'Clicked', label: 'Clicked', icon: MousePointerClick, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'LoggedIn', label: 'Logged In', icon: LogIn, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'Connected', label: 'Connected', icon: Globe, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { id: 'Paid', label: 'Paid', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'Expired', label: 'Unpublished', icon: Ban, color: 'text-slate-500', bg: 'bg-slate-500/10' },
    { id: 'Bounced', label: 'Bounced', icon: Ban, color: 'text-red-500', bg: 'bg-red-500/10' },
]

export function CRMBoard({ leads, emailLogs, onSelectLead, loading, onLeadDeleted, onRefresh }: CRMBoardProps) {
    const [leadToDelete, setLeadToDelete] = useState<DBProfile | null>(null)
    const [isPruning, setIsPruning] = useState(false)
    const [expandedColumns, setExpandedColumns] = useState<Set<Stage>>(new Set())

    // Memoize stage computation — avoids O(N×M) recalc on every render
    const { columns, leadLogCache } = useMemo(() => {
        const getLeadStage = (lead: DBProfile): Stage => getStage(lead, emailLogs)
        const cols = STAGES.reduce((acc, stage) => {
            acc[stage.id] = leads.filter(l => getLeadStage(l) === stage.id)
            return acc
        }, {} as Record<Stage, DBProfile[]>)

        // Pre-compute latest log per lead so we don't scan 142 logs per card
        const logCache = new Map<string, ReturnType<typeof getSortedLeadLogs>[0]>()
        for (const lead of leads) {
            const sorted = getSortedLeadLogs(lead, emailLogs)
            if (sorted.length > 0) logCache.set(lead.id, sorted[0])
        }

        return { columns: cols, leadLogCache: logCache }
    }, [leads, emailLogs])

    if (loading) {
        return <div className="p-10 text-center text-slate-500">Loading pipeline...</div>
    }

    const handlePruneExpired = async () => {
        if (!confirm('Are you sure you want to delete ALL unpublished (expired) agents? This cannot be undone.')) return
        setIsPruning(true)
        try {
            const res = await pruneExpiredLeads()
            alert(`Deleted ${res.deleted} expired agents.`)
            if (onRefresh) onRefresh()
        } catch (err: any) {
            alert('Failed to prune: ' + err.message)
        } finally {
            setIsPruning(false)
        }
    }

    const toggleColumn = (stageId: Stage) => {
        setExpandedColumns(prev => {
            const next = new Set(prev)
            if (next.has(stageId)) next.delete(stageId)
            else next.add(stageId)
            return next
        })
    }

    return (
        <div className="flex h-[calc(100vh-240px)] overflow-x-auto gap-4 pb-6 px-0 scrollbar-custom">
            {STAGES.map((stage) => {
                const stageLeads = columns[stage.id]
                const Icon = stage.icon
                const isExpanded = expandedColumns.has(stage.id)
                const hasMore = stageLeads.length > CARDS_LIMIT
                const visibleLeads = isExpanded ? stageLeads : stageLeads.slice(0, CARDS_LIMIT)

                return (
                    <div key={stage.id} className="min-w-[200px] flex-1 flex-shrink-0 flex flex-col bg-slate-900/20 rounded-2xl border border-slate-800/10 backdrop-blur-sm">
                        {/* Column Header */}
                        <div className={`flex items-center justify-between p-4 rounded-t-2xl border-b border-slate-800/50 ${stage.bg} mb-1 sticky top-0 z-10 backdrop-blur-md`}>
                            <div className="flex items-center gap-3">
                                <Icon className={`w-5 h-5 ${stage.color}`} />
                                <span className={`font-semibold text-base ${stage.color}`}>{stage.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {stage.id === 'Expired' && stageLeads.length > 0 && (
                                    <button
                                        onClick={handlePruneExpired}
                                        disabled={isPruning}
                                        className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                                        title="Delete All Expired Agents"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-900/50 text-slate-400 border border-slate-800/50">
                                    {stageLeads.length}
                                </span>
                            </div>
                        </div>

                        {/* Column Content */}
                        <div className="flex-1 overflow-y-auto space-y-3 p-3 scrollbar-thin">
                            {visibleLeads.map((lead) => {
                                const lastLog = leadLogCache.get(lead.id)

                                return (
                                    <div
                                        key={lead.id}
                                        onClick={() => onSelectLead(lead)}
                                        className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 rounded-xl p-4 cursor-pointer group transition-all duration-200 relative overflow-hidden hover:-translate-y-0.5"
                                    >
                                        {/* Subtle gradient background on hover */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-pink-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />

                                        <div className="flex items-center gap-4 mb-3 relative z-10">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setLeadToDelete(lead)
                                                }}
                                                className="absolute top-0 right-0 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-20"
                                                title="Delete Lead"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden shrink-0 shadow-sm">
                                                {lead.headshot_url ? (
                                                    <img src={lead.headshot_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-sm font-bold text-slate-500">{lead.full_name[0]}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-base font-semibold text-white truncate group-hover:text-indigo-400 transition-colors">
                                                    {lead.full_name}
                                                </h4>
                                                <p className="text-xs text-slate-500 truncate">{lead.brokerage || 'Email Contact'}</p>
                                            </div>
                                        </div>

                                        {/* Latest Email Subject */}
                                        {lastLog && (
                                            <div className="mb-3 px-2.5 py-1.5 bg-slate-800/50 rounded-lg text-xs text-slate-300 truncate flex items-center gap-2 border border-slate-700/50 relative z-10 group-hover:bg-slate-800 transition-colors">
                                                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                <span className="truncate flex-1 font-medium opacity-90">{lastLog.subject}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-3 border-t border-slate-800/50 relative z-10">
                                            <span>{new Date(lead.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                            <div className="flex items-center gap-1.5">
                                                {lead.website_config?.website_published && (
                                                    <div draggable="false" className="flex items-center gap-1 text-emerald-500 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                        <ExternalLink className="w-3 h-3" />
                                                        Live
                                                    </div>
                                                )}
                                                {!lead.id.startsWith('ghost-') && (
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation()
                                                            if (lead.cold_call_status) return
                                                            if (!confirm(`Add ${lead.full_name} to Cold Calls?`)) return
                                                            try {
                                                                await markAsColdCall(lead.id)
                                                                if (onRefresh) onRefresh()
                                                            } catch (err: any) {
                                                                alert('Failed: ' + err.message)
                                                            }
                                                        }}
                                                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-medium transition-all ${lead.cold_call_status
                                                            ? 'text-amber-400 bg-amber-500/10 cursor-default'
                                                            : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'
                                                            }`}
                                                        title={lead.cold_call_status ? 'In Cold Calls' : 'Add to Cold Calls'}
                                                    >
                                                        <PhoneCall className="w-3 h-3" />
                                                        {lead.cold_call_status ? 'Queued' : 'Call'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                            {/* Show All / Show Less toggle */}
                            {hasMore && (
                                <button
                                    onClick={() => toggleColumn(stage.id)}
                                    className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${stage.bg} ${stage.color} hover:opacity-80 border border-slate-800/30`}
                                >
                                    {isExpanded ? (
                                        <>
                                            <ChevronUp className="w-3.5 h-3.5" />
                                            Show less
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="w-3.5 h-3.5" />
                                            Show all {stageLeads.length}
                                        </>
                                    )}
                                </button>
                            )}

                            {stageLeads.length === 0 && (
                                <div className="h-32 border-2 border-dashed border-slate-800/30 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-700 bg-slate-900/10">
                                    <div className="p-2 rounded-full bg-slate-800/30 text-slate-700">
                                        <Icon className="w-5 h-5 opacity-50" />
                                    </div>
                                    <span className="text-xs font-medium">No leads</span>
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}


            <DeleteLeadModal
                lead={leadToDelete}
                isOpen={!!leadToDelete}
                onClose={() => setLeadToDelete(null)}
                onDeleted={(id) => {
                    if (onLeadDeleted) onLeadDeleted(id)
                    setLeadToDelete(null)
                }}
            />
        </div>
    )
}

