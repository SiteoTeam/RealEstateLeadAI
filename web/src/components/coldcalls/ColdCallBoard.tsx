import { motion, AnimatePresence } from 'framer-motion'
import { type DBProfile, updateColdCallStatus } from '../../services/api'
import {
    ClipboardList,
    Phone,
    RotateCcw,
    Star,
    XCircle,
    CheckCircle2,
    MessageSquare,
    PhoneCall,
    Clock,
} from 'lucide-react'
import { useState } from 'react'

export type ColdCallStage = 'queued' | 'called' | 'follow_up' | 'interested' | 'not_interested' | 'closed'

interface ColdCallBoardProps {
    leads: DBProfile[]
    onSelectLead: (lead: DBProfile) => void
    loading: boolean
    onLeadUpdated?: () => void
}

const STAGES: { id: ColdCallStage; label: string; icon: any; color: string; bg: string; border: string }[] = [
    { id: 'queued', label: 'Queued', icon: ClipboardList, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
    { id: 'called', label: 'Called', icon: Phone, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { id: 'follow_up', label: 'Follow Up', icon: RotateCcw, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    { id: 'interested', label: 'Interested', icon: Star, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { id: 'not_interested', label: 'Not Interested', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { id: 'closed', label: 'Closed', icon: CheckCircle2, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
]

export function ColdCallBoard({ leads, onSelectLead, loading, onLeadUpdated }: ColdCallBoardProps) {
    const [movingLeadId, setMovingLeadId] = useState<string | null>(null)

    // Group leads by cold call stage
    const columns = STAGES.reduce((acc, stage) => {
        acc[stage.id] = leads.filter(l => l.cold_call_status === stage.id)
        return acc
    }, {} as Record<ColdCallStage, DBProfile[]>)

    const handleMoveToStage = async (lead: DBProfile, newStage: ColdCallStage, e: React.MouseEvent) => {
        e.stopPropagation()
        if (movingLeadId) return
        setMovingLeadId(lead.id)
        try {
            await updateColdCallStatus(lead.id, newStage)
            if (onLeadUpdated) onLeadUpdated()
        } catch (err: any) {
            alert('Failed to update status: ' + err.message)
        } finally {
            setMovingLeadId(null)
        }
    }

    if (loading) {
        return <div className="p-10 text-center text-slate-500">Loading cold calls pipeline...</div>
    }

    return (
        <div className="flex h-[calc(100vh-280px)] overflow-x-auto gap-3 pb-6 px-0 scrollbar-custom">
            {STAGES.map((stage) => {
                const stageLeads = columns[stage.id]
                const Icon = stage.icon

                return (
                    <div key={stage.id} className="min-w-[160px] flex-1 flex-shrink-0 flex flex-col bg-slate-900/20 rounded-2xl border border-slate-800/10 backdrop-blur-sm">
                        {/* Column Header */}
                        <div className={`flex items-center justify-between p-4 rounded-t-2xl border-b border-slate-800/50 ${stage.bg} mb-1 sticky top-0 z-10 backdrop-blur-md`}>
                            <div className="flex items-center gap-3">
                                <Icon className={`w-5 h-5 ${stage.color}`} />
                                <span className={`font-semibold text-base ${stage.color}`}>{stage.label}</span>
                            </div>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-900/50 text-slate-400 border border-slate-800/50">
                                {stageLeads.length}
                            </span>
                        </div>

                        {/* Column Content */}
                        <div className="flex-1 overflow-y-auto space-y-3 p-3 scrollbar-thin">
                            <AnimatePresence mode="popLayout">
                                {stageLeads.map((lead) => {
                                    const currentStageIdx = STAGES.findIndex(s => s.id === stage.id)
                                    const nextStage = STAGES[currentStageIdx + 1]
                                    const isMoving = movingLeadId === lead.id

                                    return (
                                        <motion.div
                                            key={lead.id}
                                            layoutId={`cold-${lead.id}`}
                                            onClick={() => onSelectLead(lead)}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                            whileHover={{ y: -2 }}
                                            className={`bg-slate-900 border ${stage.border} hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 rounded-xl p-4 cursor-pointer group transition-all duration-200 relative overflow-hidden ${isMoving ? 'opacity-50' : ''}`}
                                        >
                                            {/* Subtle gradient on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-pink-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />

                                            {/* Agent Info */}
                                            <div className="flex items-center gap-3 mb-3 relative z-10">
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
                                                    <p className="text-xs text-slate-500 truncate">{lead.brokerage || 'No brokerage'}</p>
                                                </div>
                                            </div>

                                            {/* Phone (prominently displayed) */}
                                            {lead.primary_phone && (
                                                <a
                                                    href={`tel:${lead.primary_phone}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="mb-3 px-3 py-2 bg-emerald-500/10 rounded-lg text-sm text-emerald-400 flex items-center gap-2 border border-emerald-500/20 relative z-10 hover:bg-emerald-500/20 transition-colors font-medium"
                                                >
                                                    <PhoneCall className="w-4 h-4 shrink-0" />
                                                    <span className="truncate">{lead.primary_phone}</span>
                                                </a>
                                            )}

                                            {/* Call Notes Preview */}
                                            {lead.cold_call_notes && (
                                                <div className="mb-3 px-2.5 py-1.5 bg-slate-800/50 rounded-lg text-xs text-slate-300 flex items-start gap-2 border border-slate-700/50 relative z-10">
                                                    <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                                    <span className="line-clamp-2 opacity-90">{lead.cold_call_notes}</span>
                                                </div>
                                            )}

                                            {/* Footer: Date + Quick Move */}
                                            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-3 border-t border-slate-800/50 relative z-10">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>
                                                        {lead.cold_call_date
                                                            ? new Date(lead.cold_call_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                                            : 'No date'}
                                                    </span>
                                                </div>

                                                {/* Quick Move to Next Stage */}
                                                {nextStage && (
                                                    <button
                                                        onClick={(e) => handleMoveToStage(lead, nextStage.id, e)}
                                                        disabled={isMoving}
                                                        className={`flex items-center gap-1 px-2 py-1 rounded-md ${nextStage.bg} ${nextStage.color} hover:opacity-80 transition-all text-[10px] font-semibold opacity-0 group-hover:opacity-100 disabled:opacity-30`}
                                                        title={`Move to ${nextStage.label}`}
                                                    >
                                                        <span>→ {nextStage.label}</span>
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>

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
        </div>
    )
}
