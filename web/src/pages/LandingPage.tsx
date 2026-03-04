import { useEffect, useRef, useState, useCallback } from 'react'

/* ═══════════════════════════════════════════════════════════════
   SITEO LANDING — "We build it. You close deals."
   A cinematic, product-focused landing that shows what Siteo does
   rather than telling. NOT a generic SaaS template.
   ═══════════════════════════════════════════════════════════════ */

/* ─────────────── Noise texture overlay ─────────────── */
function NoiseOverlay() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.width = 256
        canvas.height = 256
        const ctx = canvas.getContext('2d')!
        const imageData = ctx.createImageData(256, 256)
        for (let i = 0; i < imageData.data.length; i += 4) {
            const v = Math.random() * 255
            imageData.data[i] = v
            imageData.data[i + 1] = v
            imageData.data[i + 2] = v
            imageData.data[i + 3] = 12
        }
        ctx.putImageData(imageData, 0, 0)
    }, [])
    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-40 mix-blend-overlay" style={{ imageRendering: 'pixelated' }} />
}

/* ─────────────── Animated Website Mockup ─────────────── */
function WebsiteMockup() {
    const [step, setStep] = useState(0)

    useEffect(() => {
        const timers = [
            setTimeout(() => setStep(1), 1200),   // nav appears
            setTimeout(() => setStep(2), 1800),   // hero text
            setTimeout(() => setStep(3), 2400),   // hero image
            setTimeout(() => setStep(4), 3000),   // listings
            setTimeout(() => setStep(5), 3600),   // contact form
            setTimeout(() => setStep(6), 4200),   // "lead captured" ping
        ]
        return () => timers.forEach(clearTimeout)
    }, [])

    return (
        <div className="relative w-full max-w-[540px] mx-auto" style={{ perspective: '1200px' }}>
            {/* Browser chrome */}
            <div
                className="rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl shadow-indigo-500/10 transition-all duration-1000"
                style={{
                    transform: 'rotateY(-3deg) rotateX(2deg)',
                    background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                }}
            >
                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="flex-1 mx-4">
                        <div className="bg-slate-700/50 rounded-md px-3 py-1 text-xs text-slate-400 text-center font-mono truncate">
                            sarahjohnson.siteo.io
                        </div>
                    </div>
                </div>

                {/* Website content */}
                <div className="p-5 space-y-4 min-h-[320px] relative overflow-hidden">

                    {/* Nav */}
                    <div className={`flex items-center justify-between transition-all duration-700 ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                        <div className="text-sm font-bold text-white">Sarah Johnson</div>
                        <div className="flex gap-3">
                            {['About', 'Listings', 'Contact'].map((t) => (
                                <span key={t} className="text-[10px] text-slate-400 font-medium">{t}</span>
                            ))}
                        </div>
                    </div>

                    {/* Hero */}
                    <div className={`transition-all duration-700 ${step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className="text-lg font-bold text-white leading-snug">Find Your Dream<br />Home in Miami</div>
                        <div className="text-[10px] text-slate-400 mt-1.5">Top 1% agent · 150+ homes sold</div>
                        <div className="mt-3 inline-block px-3 py-1.5 bg-indigo-500 rounded-md text-[10px] font-bold text-white">
                            View Listings
                        </div>
                    </div>

                    {/* Property cards */}
                    <div className={`flex gap-2 transition-all duration-700 ${step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        {[
                            { price: '$1.2M', beds: '4 bd', color: '#818cf8' },
                            { price: '$890K', beds: '3 bd', color: '#a78bfa' },
                            { price: '$2.1M', beds: '5 bd', color: '#6366f1' },
                        ].map((p, i) => (
                            <div key={i} className="flex-1 rounded-lg overflow-hidden border border-slate-700/30" style={{ animationDelay: `${i * 150}ms` }}>
                                <div className="h-14 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${p.color}22, ${p.color}08)` }}>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                    </div>
                                </div>
                                <div className="p-2 bg-slate-800/50">
                                    <div className="text-[11px] font-bold text-white">{p.price}</div>
                                    <div className="text-[9px] text-slate-500">{p.beds}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Contact form */}
                    <div className={`transition-all duration-700 ${step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className="rounded-lg border border-slate-700/30 bg-slate-800/30 p-3">
                            <div className="text-[10px] font-bold text-white mb-2">Get in Touch</div>
                            <div className="space-y-1.5">
                                <div className="h-5 bg-slate-700/40 rounded text-[9px] text-slate-500 px-2 flex items-center">name@email.com</div>
                                <div className="h-5 bg-indigo-500/80 rounded text-[9px] text-white font-bold px-2 flex items-center justify-center">Send Message</div>
                            </div>
                        </div>
                    </div>

                    {/* "Lead captured" notification ping */}
                    {step >= 5 && (
                        <div className="absolute top-3 right-3 flex items-center gap-2 bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30"
                            style={{ animation: 'popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            New lead captured!
                        </div>
                    )}

                    {/* Building cursor */}
                    {step < 5 && (
                        <div className="absolute pointer-events-none transition-all duration-500"
                            style={{
                                left: step < 2 ? '30%' : step < 3 ? '20%' : step < 4 ? '60%' : '50%',
                                top: step < 2 ? '20%' : step < 3 ? '50%' : step < 4 ? '70%' : '80%',
                            }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" opacity="0.8">
                                <path d="M5.5 3.21V20.8a.39.39 0 00.66.29l4.76-4.32 3.38 7.16a.39.39 0 00.52.18l2.07-.93a.39.39 0 00.18-.52l-3.38-7.16 6.27-1.07a.39.39 0 00.14-.71L5.5 3.21z" />
                            </svg>
                        </div>
                    )}
                </div>
            </div>

            {/* Reflection glow */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 blur-2xl opacity-20"
                style={{ background: 'linear-gradient(90deg, transparent, #6366f1, transparent)' }} />
        </div>
    )
}

/* ─────────────── Magnetic Button ─────────────── */
function MagneticButton({ children, href }: { children: React.ReactNode; href: string }) {
    const btnRef = useRef<HTMLAnchorElement>(null)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [hovered, setHovered] = useState(false)

    const handleMove = useCallback((e: React.MouseEvent) => {
        if (!btnRef.current) return
        const rect = btnRef.current.getBoundingClientRect()
        setOffset({
            x: (e.clientX - rect.left - rect.width / 2) * 0.25,
            y: (e.clientY - rect.top - rect.height / 2) * 0.25,
        })
    }, [])

    return (
        <a ref={btnRef} href={href} target="_blank" rel="noopener noreferrer"
            onMouseMove={handleMove}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => { setOffset({ x: 0, y: 0 }); setHovered(false) }}
            className="relative inline-flex group select-none"
            style={{
                transform: `translate(${offset.x}px, ${offset.y}px)`,
                transition: hovered ? 'transform 0.1s ease-out' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
        >
            {/* Glow */}
            <div className="absolute -inset-3 rounded-3xl opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500"
                style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4), transparent 70%)' }} />

            {/* Rotating border */}
            <div className="absolute -inset-[2px] rounded-2xl overflow-hidden">
                <div className="absolute inset-0" style={{
                    background: 'conic-gradient(from 0deg, #6366f1, #8b5cf6, #c084fc, #6366f1)',
                    animation: 'spin 4s linear infinite',
                }} />
            </div>

            {/* Inner */}
            <div className="relative flex items-center gap-3 px-10 py-5 text-lg font-bold text-white rounded-2xl overflow-hidden bg-slate-950">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: 'linear-gradient(135deg, #4338ca, #6366f1)' }} />
                <svg className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="relative z-10">{children}</span>
            </div>
        </a>
    )
}



/* ─────────────── Intake Form Modal ─────────────── */
const INDUSTRIES = [
    'Real Estate', 'Restaurant / Food', 'Fitness / Gym', 'Photography / Videography',
    'Law / Legal', 'Dental / Medical', 'Coaching / Consulting', 'eCommerce / Retail',
    'Construction / Home Services', 'Beauty / Salon', 'Automotive', 'Tech / SaaS', 'Other'
]

const STYLES = [
    { id: 'modern', label: 'Modern & Clean' },
    { id: 'bold', label: 'Bold & Dark' },
    { id: 'warm', label: 'Warm & Friendly' },
    { id: 'luxury', label: 'Luxury & Premium' },
    { id: 'playful', label: 'Playful & Colorful' },
    { id: 'minimal', label: 'Minimal & Simple' },
]

interface IntakeFormData {
    fullName: string
    email: string
    phone: string
    businessName: string
    industry: string
    services: string
    targetAudience: string
    currentWebsite: string
    socialMedia: string
    style: string
    notes: string
}

function IntakeFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [step, setStep] = useState(1)
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [form, setForm] = useState<IntakeFormData>({
        fullName: '', email: '', phone: '', businessName: '',
        industry: '', services: '', targetAudience: '',
        currentWebsite: '', socialMedia: '', style: '', notes: ''
    })

    const totalSteps = 3

    const update = (field: keyof IntakeFormData, value: string) =>
        setForm(prev => ({ ...prev, [field]: value }))

    const canProceed = () => {
        if (step === 1) return form.fullName && form.email && form.businessName
        if (step === 2) return form.industry && form.services
        return true
    }

    const handleSubmit = async () => {
        setSubmitting(true)
        try {
            // Send to backend
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/public/intake`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })
            if (!res.ok) throw new Error('Failed')
        } catch {
            // Fallback: mailto
            const subject = encodeURIComponent(`New Website Request: ${form.businessName}`)
            const body = encodeURIComponent(Object.entries(form).map(([k, v]) => `${k}: ${v}`).join('\n'))
            window.open(`mailto:siteoteam@gmail.com?subject=${subject}&body=${body}`)
        }
        setSubmitting(false)
        setSubmitted(true)
    }

    if (!isOpen) return null

    const inputClass = 'w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all duration-200'
    const labelClass = 'text-sm font-semibold text-slate-300 mb-1.5 block'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}
                style={{ animation: 'fadeIn 0.3s ease-out' }} />

            {/* Modal */}
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl shadow-indigo-500/10"
                style={{ animation: 'modalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>

                {/* Close button */}
                <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-white hover:bg-slate-800 transition-colors z-20">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="p-8">
                    {submitted ? (
                        /* ─── Success State ─── */
                        <div className="text-center py-8" style={{ animation: 'modalIn 0.5s ease-out' }}>
                            <div className="text-5xl mb-4">🎉</div>
                            <h3 className="text-2xl font-black text-white mb-3">You're in!</h3>
                            <p className="text-slate-400 mb-6">We'll review your info and get back to you within 24 hours with a custom preview of your site.</p>
                            <button onClick={onClose} className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors">
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="mb-8">
                                <h3 className="text-2xl font-black text-white">Build my website</h3>
                                <p className="text-sm text-slate-400 mt-1">Tell us about your business and we'll build it for you.</p>
                            </div>

                            {/* Step indicator */}
                            <div className="flex items-center gap-2 mb-8">
                                {[1, 2, 3].map(s => (
                                    <div key={s} className="flex items-center gap-2 flex-1">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${s < step ? 'bg-indigo-500 text-white' :
                                            s === step ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50' :
                                                'bg-slate-800 text-slate-600'
                                            }`}>
                                            {s < step ? '✓' : s}
                                        </div>
                                        {s < 3 && <div className={`flex-1 h-px transition-all duration-300 ${s < step ? 'bg-indigo-500' : 'bg-slate-800'}`} />}
                                    </div>
                                ))}
                            </div>

                            {/* Step 1: You */}
                            {step === 1 && (
                                <div className="space-y-4" style={{ animation: 'slideStep 0.3s ease-out' }}>
                                    <div>
                                        <label className={labelClass}>Full Name *</label>
                                        <input className={inputClass} placeholder="John Smith" value={form.fullName} onChange={e => update('fullName', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelClass}>Email *</label>
                                            <input className={inputClass} type="email" placeholder="john@email.com" value={form.email} onChange={e => update('email', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Phone</label>
                                            <input className={inputClass} type="tel" placeholder="(555) 123-4567" value={form.phone} onChange={e => update('phone', e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Business Name *</label>
                                        <input className={inputClass} placeholder="Your business or brand name" value={form.businessName} onChange={e => update('businessName', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Current Website (if any)</label>
                                        <input className={inputClass} placeholder="https://..." value={form.currentWebsite} onChange={e => update('currentWebsite', e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Business */}
                            {step === 2 && (
                                <div className="space-y-4" style={{ animation: 'slideStep 0.3s ease-out' }}>
                                    <div>
                                        <label className={labelClass}>Industry *</label>
                                        <select className={inputClass + ' cursor-pointer'} value={form.industry} onChange={e => update('industry', e.target.value)}>
                                            <option value="" className="bg-slate-800">Select your industry...</option>
                                            {INDUSTRIES.map(ind => <option key={ind} value={ind} className="bg-slate-800">{ind}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>What services do you offer? *</label>
                                        <textarea className={inputClass + ' resize-none h-20'} placeholder="e.g. Home buying, selling, property management..." value={form.services} onChange={e => update('services', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Who are your ideal clients?</label>
                                        <input className={inputClass} placeholder="e.g. First-time homebuyers in Miami" value={form.targetAudience} onChange={e => update('targetAudience', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Social Media Links</label>
                                        <input className={inputClass} placeholder="Instagram, Facebook, LinkedIn URLs..." value={form.socialMedia} onChange={e => update('socialMedia', e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Style */}
                            {step === 3 && (
                                <div className="space-y-5" style={{ animation: 'slideStep 0.3s ease-out' }}>
                                    <div>
                                        <label className={labelClass}>Pick a style</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {STYLES.map(s => (
                                                <button
                                                    key={s.id}
                                                    onClick={() => update('style', s.id)}
                                                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 text-left ${form.style === s.id
                                                        ? 'border-indigo-500 bg-indigo-500/10 text-white'
                                                        : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                                                        }`}
                                                >
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Anything else we should know?</label>
                                        <textarea className={inputClass + ' resize-none h-24'} placeholder="Special features, color preferences, inspiration sites, or anything you want us to include..." value={form.notes} onChange={e => update('notes', e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800/50">
                                {step > 1 ? (
                                    <button onClick={() => setStep(step - 1)} className="text-sm text-slate-400 hover:text-white transition-colors font-medium">
                                        ← Back
                                    </button>
                                ) : <div />}

                                {step < totalSteps ? (
                                    <button
                                        onClick={() => setStep(step + 1)}
                                        disabled={!canProceed()}
                                        className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 text-sm"
                                    >
                                        Next →
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all duration-200 text-sm flex items-center gap-2"
                                    >
                                        {submitting ? (
                                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                                        ) : (
                                            <>Submit</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

/* ═══════════════════════ MAIN LANDING PAGE ═══════════════════════ */
export function LandingPage() {
    const [mounted, setMounted] = useState(false)
    const [showIntakeForm, setShowIntakeForm] = useState(false)

    useEffect(() => {
        requestAnimationFrame(() => setMounted(true))
    }, [])

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
            <NoiseOverlay />

            {/* ═══ HERO ═══ */}
            <section className="relative min-h-screen flex items-center overflow-hidden">
                {/* Background aurora */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] opacity-25 pointer-events-none"
                    style={{ animation: 'aurora 12s ease-in-out infinite alternate' }}>
                    <div className="w-full h-full rounded-full blur-[120px]"
                        style={{ background: 'conic-gradient(from 0deg, #6366f1, #8b5cf6, #a78bfa, transparent, #6366f1)' }} />
                </div>

                {/* Grid */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: `linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)`,
                    backgroundSize: '80px 80px',
                    maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
                }} />

                {/* Two-column layout */}
                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 py-20">
                    <div className="grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">

                        {/* Left — Copy */}
                        <div>
                            {/* Logo */}
                            <div className="mb-10 transition-all duration-1000" style={{
                                opacity: mounted ? 1 : 0,
                                transform: mounted ? 'translateX(0)' : 'translateX(-30px)',
                            }}>
                                <span className="text-4xl font-black tracking-tighter text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                                    site<span style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>o</span>
                                </span>
                            </div>

                            {/* Headline */}
                            <h1 className="transition-all duration-1000 delay-200" style={{
                                opacity: mounted ? 1 : 0,
                                transform: mounted ? 'translateY(0)' : 'translateY(40px)',
                            }}>
                                <span className="block text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tight">
                                    We build it.
                                </span>
                                <span className="block text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tight mt-1"
                                    style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                    You close deals.
                                </span>
                            </h1>

                            {/* Subtitle */}
                            <p className="text-lg md:text-xl text-slate-400 mt-8 max-w-lg leading-relaxed transition-all duration-1000 delay-500"
                                style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(30px)' }}>
                                AI-powered lead funnels that capture clients, book appointments, and make
                                you look like the #1 choice in your market <span className="text-slate-200 font-semibold">in 24 hours.</span>
                            </p>

                            {/* CTA */}
                            <div className="mt-10 flex flex-col sm:flex-row items-start gap-5 transition-all duration-1000 delay-700"
                                style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)' }}>
                                <MagneticButton href="https://calendly.com/siteoteam/30min">
                                    Book a Demo
                                </MagneticButton>
                                <div className="flex items-center gap-2 text-slate-500 text-sm self-center">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    3 spots left this week
                                </div>
                            </div>
                        </div>

                        {/* Right — Animated mockup */}
                        <div className="transition-all duration-[1.5s] delay-300"
                            style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0) scale(1)' : 'translateY(60px) scale(0.9)' }}>
                            <WebsiteMockup />
                        </div>
                    </div>
                </div>

                {/* Scroll hint */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-600 transition-all duration-1000 delay-[1.5s]"
                    style={{ opacity: mounted ? 1 : 0 }}>
                    <span className="text-[10px] tracking-[3px] uppercase font-medium">Scroll</span>
                    <div className="w-5 h-8 rounded-full border border-slate-700 flex items-start justify-center p-1.5">
                        <div className="w-1 h-2 rounded-full bg-indigo-400" style={{ animation: 'scrollDot 2s ease-in-out infinite' }} />
                    </div>
                </div>
            </section>

            {/* ═══ SECTION 2 — THE PITCH ═══ */}
            <section className="relative overflow-hidden">
                {/* Background effects for the entire section */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[200px] opacity-10 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #6366f1, #7c3aed, transparent)' }} />

                {/* ── Industry Marquee ── */}
                <div className="py-8 border-b border-white/5 overflow-hidden relative">
                    <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-950 to-transparent z-10" />
                    <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-950 to-transparent z-10" />
                    <div className="flex gap-8 whitespace-nowrap" style={{ animation: 'marquee 30s linear infinite' }}>
                        {[...['Restaurants', 'Real Estate', 'Fitness Studios', 'Photographers', 'Law Firms', 'Dentists', 'Coaches', 'Consultants', 'eCommerce', 'Startups', 'Agencies', 'Freelancers'], ...['Restaurants', 'Real Estate', 'Fitness Studios', 'Photographers', 'Law Firms', 'Dentists', 'Coaches', 'Consultants', 'eCommerce', 'Startups', 'Agencies', 'Freelancers']].map((industry, i) => (
                            <span key={i} className="flex items-center gap-2.5 text-sm text-slate-500 font-medium shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60" />
                                {industry}
                            </span>
                        ))}
                    </div>
                </div>

                {/* ── How it Works + CTA ── */}
                <div className="max-w-6xl mx-auto px-6 md:px-12 py-32">
                    {/* Section Title */}
                    <div className="text-center mb-20">
                        <span className="text-xs font-bold text-indigo-400 tracking-[4px] uppercase mb-5 block">How it works</span>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                            Live in <span style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>three days.</span>
                            <br className="hidden sm:block" />
                            <span className="text-slate-500"> Not three months.</span>
                        </h2>
                    </div>

                    {/* Timeline Cards — horizontal with connecting line */}
                    <div className="relative">
                        {/* Connecting line behind cards */}
                        <div className="hidden md:block absolute top-[60px] left-[16%] right-[16%] h-px bg-gradient-to-r from-indigo-500/30 via-indigo-500/60 to-indigo-500/30" />

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    day: 'DAY 1',
                                    step: '01',
                                    title: 'We build your system',
                                    desc: 'Custom acquisition funnel, your brand, your content. Done for you — no templates.',
                                    accent: '#818cf8',
                                },
                                {
                                    day: 'DAY 2',
                                    step: '02',
                                    title: 'You go live',
                                    desc: 'Custom domain, SEO-ready, mobile-perfect. Your online HQ.',
                                    accent: '#a78bfa',
                                },
                                {
                                    day: 'DAY 3+',
                                    step: '03',
                                    title: 'Leads start coming',
                                    desc: 'Automated outreach + lead capture running on autopilot.',
                                    accent: '#c084fc',
                                },
                            ].map((item, i) => (
                                <div key={i} className="group relative">
                                    {/* Step number circle */}
                                    <div className="relative z-10 w-[120px] mx-auto mb-6 flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold mb-2 border"
                                            style={{ borderColor: `${item.accent}40`, color: item.accent, background: `${item.accent}10`, boxShadow: `0 0 20px ${item.accent}15` }}>
                                            {item.step}
                                        </div>
                                        <span className="text-[10px] font-bold tracking-[3px] uppercase" style={{ color: item.accent }}>
                                            {item.day}
                                        </span>
                                    </div>

                                    {/* Card */}
                                    <div className="relative rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-8 transition-all duration-500 hover:border-indigo-500/20 hover:bg-white/[0.04] hover:-translate-y-1">
                                        <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>

                                        {/* Bottom glow on hover */}
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                            style={{ background: `linear-gradient(90deg, transparent, ${item.accent}40, transparent)` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── CTA Card ── */}
                    <div className="mt-32 relative flex items-center justify-center">
                        {/* Radial glow behind card */}
                        <div className="absolute w-[500px] h-[500px] rounded-full blur-[150px] opacity-20 pointer-events-none"
                            style={{ background: 'radial-gradient(circle, #6366f1, #7c3aed, transparent)' }} />

                        {/* Animated border ring */}
                        <div className="absolute w-[calc(100%+4px)] h-[calc(100%+4px)] rounded-[28px] opacity-60 pointer-events-none"
                            style={{
                                background: 'conic-gradient(from 0deg, #6366f1, #a78bfa, #c084fc, #6366f1)',
                                animation: 'spin 6s linear infinite',
                                filter: 'blur(1px)',
                            }} />

                        {/* Card */}
                        <div className="relative rounded-[26px] bg-slate-950/90 backdrop-blur-xl px-8 md:px-16 py-16 text-center max-w-2xl w-full border border-white/5">
                            {/* Inner glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

                            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
                                Ready to stand out?
                            </h2>
                            <p className="text-base md:text-lg text-slate-400 mb-10 max-w-md mx-auto leading-relaxed">
                                Tell us about your business and we'll build you a customer acquisition system that turns visitors into clients.
                            </p>

                            {/* Form trigger button */}
                            <button
                                onClick={() => setShowIntakeForm(true)}
                                className="group relative inline-flex items-center gap-3 px-10 py-5 text-lg font-bold text-white rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/30 active:scale-[0.98] select-none"
                                style={{ background: 'linear-gradient(135deg, #4338ca, #6366f1, #7c3aed)' }}
                            >
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    <div className="absolute inset-0" style={{
                                        background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.12) 55%, transparent 60%)',
                                        animation: 'shimmerSweep 2s ease-in-out infinite',
                                    }} />
                                </div>
                                <span className="relative z-10 flex items-center gap-3">
                                    Get Started — It's Free
                                </span>
                            </button>

                            {/* Trust signals */}
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-500">
                                {['No credit card', 'Live in 3 days', 'Cancel anytime'].map((t, i) => (
                                    <span key={i} className="flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-emerald-500/80" />
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-20 border-t border-white/5 bg-slate-950/90 backdrop-blur-xl">
                <div className="container mx-auto px-6 max-w-6xl py-12">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        {/* Brand */}
                        <div className="flex flex-col items-center md:items-start gap-2">
                            <span className="text-2xl font-black tracking-tighter text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                                site<span style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>o</span>
                            </span>
                            <p className="text-slate-600 text-xs">Websites that work while you sleep.</p>
                        </div>

                        {/* Links */}
                        <div className="flex items-center gap-8 text-sm text-slate-500">
                            <a href="/privacy" className="hover:text-indigo-400 transition-colors duration-200">
                                Privacy Policy
                            </a>
                            <a href="mailto:siteoteam@gmail.com" className="hover:text-indigo-400 transition-colors duration-200">
                                siteoteam@gmail.com
                            </a>
                            <a href="tel:+13234437252" className="hover:text-indigo-400 transition-colors duration-200">
                                (323) 443-7252
                            </a>
                        </div>
                    </div>

                    {/* Divider + Copyright */}
                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-xs text-slate-700">&copy; {new Date().getFullYear()} Siteo. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            {/* Intake Form Modal */}
            <IntakeFormModal isOpen={showIntakeForm} onClose={() => setShowIntakeForm(false)} />

            {/* ─── Keyframes ─── */}
            <style>{`
                @keyframes aurora {
                    0% { transform: translateX(-50%) rotate(0deg) scale(1); }
                    100% { transform: translateX(-50%) rotate(15deg) scale(1.1) translateY(-40px); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                @keyframes scrollDot {
                    0%, 100% { transform: translateY(0); opacity: 0.4; }
                    50% { transform: translateY(6px); opacity: 1; }
                }
                @keyframes popIn {
                    0% { transform: scale(0) translateY(10px); opacity: 0; }
                    100% { transform: scale(1) translateY(0); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes slideStep {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes shimmerSweep {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
            `}</style>
        </div>
    )
}
