import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LogOut, Zap, LayoutDashboard, Settings, BarChart, Sparkles, Clock, AlertTriangle } from 'lucide-react'
import { getWebsiteBySlug, createCheckoutSession, cancelSubscription, type DBProfile } from '../../services/api'
import { adminApi } from '../../services/adminApi'
import { DomainManager } from '../../components/admin/DomainManager'
import { HelpButton } from '../../components/admin/HelpButton'

export function AdminDashboard() {
    const { slug } = useParams()
    const navigate = useNavigate()
    const [agent, setAgent] = useState<DBProfile | null>(null)
    const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview')
    const [upgrading, setUpgrading] = useState(false)
    const [canceling, setCanceling] = useState(false)
    const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 })

    // Trial Logic
    const trialDays = 30
    // Trial only starts when agent clicks email link (sets trial_started_at)
    const trialStarted = agent?.trial_started_at ? new Date(agent.trial_started_at) : null
    const now = new Date()
    let isExpired = false

    useEffect(() => {
        if (!trialStarted) return

        const expiresAt = new Date(trialStarted.getTime() + trialDays * 24 * 60 * 60 * 1000).getTime()

        const timer = setInterval(() => {
            const nowTime = new Date().getTime()
            const distance = expiresAt - nowTime

            if (distance < 0) {
                setTimeLeft({ d: 0, h: 0, m: 0, s: 0 })
                // We handle isExpired dynamically in render, but state update helps consistency
            } else {
                setTimeLeft({
                    d: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    s: Math.floor((distance % (1000 * 60)) / 1000)
                })
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [trialStarted])

    if (trialStarted) {
        const expiresAt = new Date(trialStarted.getTime() + trialDays * 24 * 60 * 60 * 1000)
        if (now.getTime() > expiresAt.getTime()) isExpired = true
    }

    // Auth & Data Fetch
    useEffect(() => {
        // ... (existing code) ...
        async function init() {
            if (!slug) return
            const token = localStorage.getItem(`admin_token_${slug}`)
            if (!token) {
                navigate(`/w/${slug}/admin/login`)
                return
            }

            try {
                const data = await getWebsiteBySlug(slug)
                setAgent(data)
            } catch (err) {
                console.error(err)
            }
        }
        init()
    }, [slug, navigate])

    // Track Access from Email Links
    useEffect(() => {
        if (!slug) return

        const params = new URLSearchParams(window.location.search)
        const source = params.get('source')

        if (source === 'email') {
            const token = localStorage.getItem(`admin_token_${slug}`)
            if (token) {
                // Fire and forget - logs the access to update "Last Login"
                adminApi.logAccess(token, 'email_link')
            }
        }
    }, [slug])

    const handleLogout = () => {
        if (slug) localStorage.removeItem(`admin_token_${slug}`)
        navigate(`/w/${slug}/admin/login`)
    }

    const handleLaunchEditor = () => {
        // Navigate to public website with edit=true param
        window.open(`/w/${slug}?edit=true`, '_blank')
    }

    const handleUpgrade = async () => {
        if (!agent) return
        setUpgrading(true)
        try {
            const { url } = await createCheckoutSession(agent.id, window.location.href)
            if (url) window.location.href = url
        } catch (err) {
            alert('Failed to start checkout')
            setUpgrading(false)
        }
    }

    const handleCancelSubscription = async () => {
        if (!agent) return
        if (!confirm('Are you sure you want to cancel your subscription? Your website will remain active until the end of your billing period.')) return

        setCanceling(true)
        try {
            await cancelSubscription(agent.id)
            alert('Your subscription has been canceled. Your website will remain active until the end of your current billing period.')
            // Refresh agent data
            const data = await getWebsiteBySlug(slug!)
            setAgent(data)
        } catch (err: any) {
            alert(err.message || 'Failed to cancel subscription')
        } finally {
            setCanceling(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
            {/* Sidebar ... */}
            <aside className="w-64 border-r border-slate-200 bg-white flex flex-col">
                <div className="p-6 border-b border-slate-200 flex items-center gap-3">
                    {agent ? (
                        <>
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-500/30 flex-shrink-0">
                                <img
                                    src={agent.headshot_url || ''}
                                    alt={agent.full_name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-sm truncate">{agent.full_name}</p>
                                <p className="text-xs text-slate-500 truncate">Admin Console</p>
                            </div>
                        </>
                    ) : (
                        // Skeleton ...
                        <>
                            <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
                                <div className="h-3 bg-slate-200 rounded w-16 animate-pulse" />
                            </div>
                        </>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {/* ... Nav Items ... */}
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'overview' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        Overview
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-xl font-medium transition-colors">
                        <BarChart className="w-5 h-5" />
                        Analytics
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                    >
                        <Settings className="w-5 h-5" />
                        Settings
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-200">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl font-medium transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Header */}
                <header className="h-20 border-b border-slate-200 bg-white flex items-center justify-between px-8">
                    <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>

                    <div className="flex items-center gap-4">
                        {/* Upgrade Button */}
                        {agent && !agent.is_paid && (
                            <button
                                onClick={handleUpgrade}
                                disabled={upgrading}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-orange-500/20"
                            >
                                <Sparkles className="w-4 h-4" />
                                {upgrading ? 'Processing...' : 'Activate Plan'}
                            </button>
                        )}

                        <button
                            onClick={handleLaunchEditor}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-indigo-600/20"
                        >
                            <Zap className="w-4 h-4" />
                            Open Visual Editor
                        </button>
                    </div>
                </header>



                {/* Content Area */}
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto space-y-8">

                        {activeTab === 'overview' && (
                            <>
                                {/* Detailed Trial Timer */}
                                {agent && !agent.is_paid && trialStarted ? (
                                    <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl p-8 md:p-12 mb-8">
                                        {/* Background Decoration */}
                                        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                                        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-purple-600 rounded-full blur-3xl opacity-20"></div>

                                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">

                                            {/* Text Content */}
                                            <div className="text-center md:text-left md:w-1/2">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-sm font-medium mb-6">
                                                    <Clock className="w-4 h-4" />
                                                    {isExpired ? 'Trial Expired' : 'Free Trial Active'}
                                                </div>

                                                <h3 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                                    {isExpired ? 'Website Unpublished' : 'Unlock Your Full Potential'}
                                                </h3>

                                                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                                                    {isExpired
                                                        ? 'Your trial period has ended. Upgrade now to restore public access to your professional agent website.'
                                                        : 'Experience the full power of Siteo Pro. Your website is live and collecting leads. Upgrade anytime to keep it that way.'}
                                                </p>

                                                <button
                                                    onClick={handleUpgrade}
                                                    disabled={upgrading}
                                                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 transform hover:scale-105"
                                                >
                                                    {upgrading ? (
                                                        <span className="animate-pulse">Processing...</span>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="w-5 h-5" />
                                                            {isExpired ? 'Restore Website Access' : 'Activate Full Plan - $17/mo'}
                                                        </>
                                                    )}
                                                </button>
                                                <p className="mt-4 text-xs text-slate-500">Secure payment via Stripe • Cancel anytime</p>
                                            </div>

                                            {/* Countdown */}
                                            <div className="md:w-1/2 w-full">
                                                {!isExpired ? (
                                                    <div className="grid grid-cols-4 gap-4">
                                                        <TimeBox value={timeLeft.d} label="Days" />
                                                        <TimeBox value={timeLeft.h} label="Hours" />
                                                        <TimeBox value={timeLeft.m} label="Minutes" />
                                                        <TimeBox value={timeLeft.s} label="Seconds" />
                                                    </div>
                                                ) : (
                                                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
                                                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                                        <h4 className="text-xl font-bold text-red-500 mb-2">Access Revoked</h4>
                                                        <p className="text-red-400/80">Your website is no longer visible to the public.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Summary Cards (Only for Paid Users) */
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                                            <h3 className="text-slate-500 text-sm font-medium mb-2">Total Views</h3>
                                            <p className="text-3xl font-bold text-slate-900">1,240</p>
                                        </div>
                                        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                                            <h3 className="text-slate-500 text-sm font-medium mb-2">Leads Captured</h3>
                                            <p className="text-3xl font-bold text-indigo-600">12</p>
                                        </div>
                                        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                                            <h3 className="text-slate-500 text-sm font-medium mb-2">Avg. Time</h3>
                                            <p className="text-3xl font-bold text-slate-900">2m 15s</p>
                                        </div>
                                    </div>
                                )}

                                {/* Domain Manager */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        {agent ? (
                                            <DomainManager
                                                agentId={agent.id}
                                                initialDomain={agent.website_config?.custom_domain}
                                                token={localStorage.getItem(`admin_token_${slug}`) || ''}
                                            />
                                        ) : (
                                            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 shadow-sm">
                                                Loading Domain Settings...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'settings' && (
                            <div className="space-y-8">
                                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                                    <h2 className="text-xl font-bold text-slate-900 mb-6">Security Settings</h2>

                                    <div className="max-w-md">
                                        <ChangePasswordForm slug={slug || ''} />
                                    </div>
                                </div>

                                {/* Billing Portal - For Paid Users */}
                                {agent?.is_paid && agent?.stripe_customer_id && (
                                    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                                        <h2 className="text-xl font-bold text-slate-900 mb-2">Billing & Payment Method</h2>
                                        <p className="text-slate-500 mb-6">
                                            Update your credit card, view payment history, and manage your subscription details.
                                        </p>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/stripe/create-portal-session`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ leadId: agent.id, returnUrl: window.location.href })
                                                    });
                                                    const data = await res.json();
                                                    if (data.url) window.location.href = data.url;
                                                    else alert('Failed to create portal session');
                                                } catch (err) {
                                                    console.error(err);
                                                    alert('Error launching billing portal');
                                                }
                                            }}
                                            className="px-6 py-3 bg-white text-slate-700 font-semibold rounded-lg hover:bg-slate-50 border border-slate-300 shadow-sm transition-all"
                                        >
                                            Manage Subscription
                                        </button>
                                    </div>
                                )}

                                {/* Cancel Subscription - Only for paid users */}
                                {agent?.is_paid && agent?.stripe_subscription_id && (
                                    <div className="bg-white border border-red-200 rounded-2xl p-8 shadow-sm">
                                        <h2 className="text-xl font-bold text-slate-900 mb-2">Subscription</h2>
                                        <p className="text-slate-500 mb-6">
                                            Your subscription is active. If you cancel, your website will remain live until the end of your current billing period.
                                        </p>
                                        <button
                                            onClick={handleCancelSubscription}
                                            disabled={canceling}
                                            className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 border border-red-200"
                                        >
                                            {canceling ? 'Canceling...' : 'Cancel Subscription'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'overview' && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <LayoutDashboard className="w-8 h-8 text-slate-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to your Dashboard</h2>
                                <p className="text-slate-500 max-w-lg mx-auto">
                                    This is where you'll manage your leads, analytics, and website settings.
                                    Use the "Open Visual Editor" button above to customize your public website.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <HelpButton />
        </div>
    )
}

function ChangePasswordForm({ slug }: { slug: string }) {
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            setStatus('error')
            setMessage('Passwords do not match')
            return
        }
        if (newPassword.length < 6) {
            setStatus('error')
            setMessage('Password must be at least 6 characters')
            return
        }

        setStatus('loading')
        try {
            const token = localStorage.getItem(`admin_token_${slug}`)
            if (!token) throw new Error('Not authenticated')

            await adminApi.changePassword(newPassword, token)
            setStatus('success')
            setMessage('Password updated successfully')
            setNewPassword('')
            setConfirmPassword('')
        } catch (err: any) {
            setStatus('error')
            setMessage(err.message || 'Failed to update password')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">New Password</label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    placeholder="Enter new password"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Confirm Password</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    placeholder="Confirm new password"
                />
            </div>

            {message && (
                <div className={`p-3 rounded-lg text-sm ${status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {message}
                </div>
            )}

            <button
                type="submit"
                disabled={status === 'loading'}
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
                {status === 'loading' ? 'Updating...' : 'Update Password'}
            </button>
        </form>
    )
}

function TimeBox({ value, label }: { value: number; label: string }) {
    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center justify-center border border-white/5">
            <span className="text-2xl md:text-3xl font-bold font-mono text-white mb-1">
                {String(value).padStart(2, '0')}
            </span>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">{label}</span>
        </div>
    )
}
