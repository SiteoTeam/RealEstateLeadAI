import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Helmet } from 'react-helmet-async'

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
function MagneticButton({ children, href, onClick }: { children: React.ReactNode; href?: string; onClick?: (e: React.MouseEvent) => void }) {
    const btnRef = useRef<HTMLAnchorElement>(null)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [hovered, setHovered] = useState(false)
    const isTouch = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches

    const handleMove = useCallback((e: React.MouseEvent) => {
        if (isTouch || !btnRef.current) return
        const rect = btnRef.current.getBoundingClientRect()
        setOffset({
            x: (e.clientX - rect.left - rect.width / 2) * 0.25,
            y: (e.clientY - rect.top - rect.height / 2) * 0.25,
        })
    }, [isTouch])

    const Tag = href ? 'a' : 'button'
    const props = href ? { href, target: "_blank", rel: "noopener noreferrer" } : { onClick }

    return (
        <Tag ref={btnRef as any} {...props}
            onMouseMove={handleMove}
            onMouseEnter={() => { if (!isTouch) setHovered(true) }}
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

            {/* Rotating border — spin disabled on touch/mobile, static gradient instead */}
            <div className="absolute -inset-[2px] rounded-2xl overflow-hidden">
                <div className="absolute inset-0" style={{
                    background: 'conic-gradient(from 0deg, #6366f1, #8b5cf6, #c084fc, #6366f1)',
                    animation: isTouch ? 'none' : 'spin 4s linear infinite',
                }} />
            </div>

            {/* Inner */}
            <div className="relative flex items-center gap-3 px-7 py-4 md:px-10 md:py-5 text-base md:text-lg font-bold text-white rounded-2xl overflow-hidden bg-slate-950">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: 'linear-gradient(135deg, #4338ca, #6366f1)' }} />
                <svg className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="relative z-10">{children}</span>
            </div>
        </Tag>
    )
}

/* ─────────────── Scroll Reveal Hook ─────────────── */
function useScrollReveal(options: { threshold?: number; rootMargin?: string } = {}) {
    const ref = useRef<HTMLDivElement>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(el) } },
            { threshold: options.threshold ?? 0.15, rootMargin: options.rootMargin ?? '0px 0px -60px 0px' }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [options.threshold, options.rootMargin])

    return { ref, isVisible }
}

/* ─────────────── Cursor Spotlight ─────────────── */
function CursorSpotlight() {
    const [pos, setPos] = useState({ x: -500, y: -500 })

    useEffect(() => {
        if (window.matchMedia('(hover: none)').matches) return
        let rafId: number
        const onMove = (e: MouseEvent) => {
            cancelAnimationFrame(rafId)
            rafId = requestAnimationFrame(() => setPos({ x: e.clientX, y: e.clientY }))
        }
        window.addEventListener('mousemove', onMove, { passive: true })
        return () => {
            window.removeEventListener('mousemove', onMove)
            cancelAnimationFrame(rafId)
        }
    }, [])

    return (
        <div className="fixed inset-0 pointer-events-none z-50 opacity-60" style={{
            background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, rgba(99,102,241,0.06), transparent 40%)`,
        }} />
    )
}

/* ─────────────── 3D Tilt Hook ─────────────── */
function use3DTilt() {
    const ref = useRef<HTMLDivElement>(null)
    const [transform, setTransform] = useState('perspective(800px) rotateX(0deg) rotateY(0deg)')
    const isTouch = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches

    const handleMove = useCallback((e: React.MouseEvent) => {
        if (isTouch || !ref.current) return
        const rect = ref.current.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5
        setTransform(`perspective(800px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.02)`)
    }, [isTouch])

    const handleLeave = useCallback(() => {
        setTransform('perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)')
    }, [])

    return { ref, transform, handleMove, handleLeave }
}

/* ─────────────── Text Scramble Effect ─────────────── */
function TextScramble({ text, isVisible, delay = 0 }: { text: string; isVisible: boolean; delay?: number }) {
    const [display, setDisplay] = useState('')
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'

    useEffect(() => {
        if (!isVisible) { setDisplay(''); return }
        let rafId: number
        const timeoutId = setTimeout(() => {
            const duration = text.length * 90
            const startTime = performance.now()
            const tick = (now: number) => {
                const progress = Math.min((now - startTime) / duration, 1)
                const resolved = Math.floor(progress * text.length)
                let result = ''
                for (let i = 0; i < text.length; i++) {
                    if (text[i] === ' ') { result += ' '; continue }
                    if (i < resolved) { result += text[i]; continue }
                    result += chars[Math.floor(Math.random() * chars.length)]
                }
                setDisplay(result)
                if (progress < 1) { rafId = requestAnimationFrame(tick) } else { setDisplay(text) }
            }
            rafId = requestAnimationFrame(tick)
        }, delay)
        return () => { clearTimeout(timeoutId); cancelAnimationFrame(rafId) }
    }, [isVisible, text, delay])

    return <>{display || '\u00A0'.repeat(text.length)}</>
}

/* ─────────────── Floating Particles (Enhanced) ─────────────── */
function FloatingParticles() {
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
    const particles = useMemo(() => {
        if (isMobile) return []
        return Array.from({ length: 50 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 4 + 1,
            duration: Math.random() * 20 + 8,
            delay: Math.random() * 15,
            opacity: Math.random() * 0.4 + 0.05,
            glow: i < 8,
        }))
    }, [isMobile])

    if (particles.length === 0) return null

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.glow ? p.size * 2 : p.size,
                        height: p.glow ? p.size * 2 : p.size,
                        opacity: p.opacity,
                        background: p.glow ? 'radial-gradient(circle, rgba(129,140,248,0.8), rgba(129,140,248,0) 70%)' : '#818cf8',
                        animation: `floatParticle ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
                        filter: p.glow ? 'blur(1px)' : 'none',
                    }}
                />
            ))}
        </div>
    )
}

/* ─────────────── Animated Counter ─────────────── */
function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
    const [count, setCount] = useState(0)
    const { ref, isVisible } = useScrollReveal({ threshold: 0.5 })

    useEffect(() => {
        if (!isVisible) return
        const duration = 1500
        const startTime = performance.now()
        const animate = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(eased * target))
            if (progress < 1) requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
    }, [isVisible, target])

    return <span ref={ref}>{count}{suffix}</span>
}

/* ─────────────── 3D Tilt Card ─────────────── */
function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    const tilt = use3DTilt()
    return (
        <div
            ref={tilt.ref}
            onMouseMove={tilt.handleMove}
            onMouseLeave={tilt.handleLeave}
            className={className}
            style={{ transform: tilt.transform, transition: 'transform 0.15s ease-out', transformStyle: 'preserve-3d' }}
        >
            {children}
        </div>
    )
}



/* ─────────────── Intake Form Modal ─────────────── */
const INDUSTRIES = [
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
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'form_submit', { form_name: 'intake' });
        }
    }

    if (!isOpen) return null

    const inputClass = 'w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all duration-200'
    const labelClass = 'text-sm font-semibold text-slate-300 mb-1.5 block'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-950/80 md:backdrop-blur-sm" onClick={onClose}
                style={{ animation: 'fadeIn 0.3s ease-out' }} />

            {/* Modal */}
            <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl shadow-indigo-500/10"
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
                                <h3 id="modal-title" className="text-2xl font-black text-white">Build my website</h3>
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
                                        <label htmlFor="fullName" className={labelClass}>Full Name *</label>
                                        <input id="fullName" className={inputClass} placeholder="John Smith" value={form.fullName} onChange={e => update('fullName', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label htmlFor="email" className={labelClass}>Email *</label>
                                            <input id="email" className={inputClass} type="email" placeholder="john@email.com" value={form.email} onChange={e => update('email', e.target.value)} />
                                        </div>
                                        <div>
                                            <label htmlFor="phone" className={labelClass}>Phone</label>
                                            <input id="phone" className={inputClass} type="tel" placeholder="(555) 123-4567" value={form.phone} onChange={e => update('phone', e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="businessName" className={labelClass}>Business Name *</label>
                                        <input id="businessName" className={inputClass} placeholder="Your business or brand name" value={form.businessName} onChange={e => update('businessName', e.target.value)} />
                                    </div>
                                    <div>
                                        <label htmlFor="currentWebsite" className={labelClass}>Current Website (if any)</label>
                                        <input id="currentWebsite" className={inputClass} placeholder="https://..." value={form.currentWebsite} onChange={e => update('currentWebsite', e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Business */}
                            {step === 2 && (
                                <div className="space-y-4" style={{ animation: 'slideStep 0.3s ease-out' }}>
                                    <div>
                                        <label htmlFor="industry" className={labelClass}>Industry *</label>
                                        <select id="industry" className={inputClass + ' cursor-pointer'} value={form.industry} onChange={e => update('industry', e.target.value)}>
                                            <option value="" className="bg-slate-800">Select your industry...</option>
                                            {INDUSTRIES.map(ind => <option key={ind} value={ind} className="bg-slate-800">{ind}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="services" className={labelClass}>What services do you offer? *</label>
                                        <textarea id="services" className={inputClass + ' resize-none h-20'} placeholder="e.g. Home buying, selling, property management..." value={form.services} onChange={e => update('services', e.target.value)} />
                                    </div>
                                    <div>
                                        <label htmlFor="targetAudience" className={labelClass}>Who are your ideal clients?</label>
                                        <input id="targetAudience" className={inputClass} placeholder="e.g. First-time homebuyers in Miami" value={form.targetAudience} onChange={e => update('targetAudience', e.target.value)} />
                                    </div>
                                    <div>
                                        <label htmlFor="socialMedia" className={labelClass}>Social Media Links</label>
                                        <input id="socialMedia" className={inputClass} placeholder="Instagram, Facebook, LinkedIn URLs..." value={form.socialMedia} onChange={e => update('socialMedia', e.target.value)} />
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
                                        <label htmlFor="notes" className={labelClass}>Anything else we should know?</label>
                                        <textarea id="notes" className={inputClass + ' resize-none h-24'} placeholder="Special features, color preferences, inspiration sites, or anything you want us to include..." value={form.notes} onChange={e => update('notes', e.target.value)} />
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
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches

    // Scroll reveal refs for section 2
    const sectionTitle = useScrollReveal({ threshold: 0.2 })
    const card0 = useScrollReveal({ threshold: 0.15, rootMargin: '0px 0px -80px 0px' })
    const card1 = useScrollReveal({ threshold: 0.15, rootMargin: '0px 0px -80px 0px' })
    const card2 = useScrollReveal({ threshold: 0.15, rootMargin: '0px 0px -80px 0px' })
    const cardRefs = [card0, card1, card2]
    const ctaReveal = useScrollReveal({ threshold: 0.2 })

    // Framer Motion global scroll hooks
    const { scrollY } = useScroll()
    const { scrollYProgress: pitchScrollYProgress } = useScroll({
        target: useRef<HTMLDivElement>(null), // We'll attach this to the Pitch section below
        offset: ['start end', 'end start']
    })

    const heroOpacity = useTransform(scrollY, [200, 600], [1, 0])
    const heroTranslateY = useTransform(scrollY, [200, 600], [0, 30])

    // Parallax glow effect
    const parallaxGlowY = useTransform(pitchScrollYProgress, [0, 1], [-200, 400])

    const scrollBeamHeight = useTransform(pitchScrollYProgress, [0, 0.8], ['0%', '100%'])
    const scrollBeamOpacity = useTransform(pitchScrollYProgress, [0, 0.05], [0, 1])

    useEffect(() => {
        requestAnimationFrame(() => setMounted(true))
        // Override the global white body background from index.css so mobile overscroll doesn't show white
        document.documentElement.style.backgroundColor = '#020617'
        document.body.style.backgroundColor = '#020617'
        return () => {
            document.documentElement.style.backgroundColor = ''
            document.body.style.backgroundColor = ''
        }
    }, [])

    return (
        <main className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
            <Helmet>
                <title>Siteo | The AI Website Builder for Real Estate</title>
                <meta name="description" content="Siteo builds powerful AI acquisition funnels and websites for real estate agents in just three days, not three months." />
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": ["Organization", "SoftwareApplication"],
                        "name": "Siteo AI",
                        "url": "https://siteo.io",
                        "logo": "https://siteo.io/siteo-icon.png",
                        "applicationCategory": "BusinessApplication",
                        "operatingSystem": "All",
                        "description": "AI-powered website builder for real estate agents.",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "USD"
                        }
                    })}
                </script>
            </Helmet>
            {!isMobile && <NoiseOverlay />}

            {/* ═══ HERO ═══ */}
            <section className="relative min-h-screen flex items-center overflow-hidden">
                {/* Background aurora — desktop only, blur-[120px] is too heavy on mobile */}
                <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] opacity-25 pointer-events-none"
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
                <motion.div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 py-14 md:py-20"
                    style={{ opacity: heroOpacity, y: heroTranslateY, transition: 'opacity 0.1s, transform 0.1s' }}>
                    <div className="grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">

                        {/* Left — Copy */}
                        <div>
                            {/* Logo */}
                            <div className="mb-6 md:mb-10 transition-all duration-1000" style={{
                                opacity: mounted ? 1 : 0,
                                transform: mounted ? 'translateX(0)' : 'translateX(-30px)',
                            }}>
                                <span className="text-4xl font-black tracking-tighter text-white font-heading">
                                    site<span style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>o</span>
                                </span>
                            </div>

                            {/* Headline */}
                            <h1 className="transition-all duration-1000 delay-200 font-heading" style={{
                                opacity: mounted ? 1 : 0,
                                transform: mounted ? 'translateY(0)' : 'translateY(40px)',
                            }}>
                                <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-black leading-[1.05] tracking-tight">
                                    Get a Top-Tier Website
                                </span>
                                <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-black leading-[1.05] tracking-tight mt-1"
                                    style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                    Without Spending $5,000.
                                </span>
                            </h1>

                            {/* Subtitle */}
                            <p className="text-base md:text-xl text-slate-400 mt-5 md:mt-8 max-w-lg leading-relaxed transition-all duration-1000 delay-500"
                                style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(30px)' }}>
                                AI-powered lead funnels that capture clients, book appointments, and make
                                you look like the #1 choice in your market <span className="text-slate-200 font-semibold">in <AnimatedNumber target={24} suffix=" hours" />.</span>
                            </p>

                            {/* CTA */}
                            <div className="mt-7 md:mt-10 flex flex-col sm:flex-row items-start gap-5 transition-all duration-1000 delay-700"
                                style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)' }}>
                                <div className="flex flex-col gap-2">
                                    <div onClick={() => { setShowIntakeForm(true); if (typeof window !== 'undefined' && (window as any).gtag) (window as any).gtag('event', 'cta_click', { location: 'hero' }); }}>
                                        <MagneticButton>
                                            Build My Free Site
                                        </MagneticButton>
                                    </div>
                                    <div className="text-xs text-slate-500 text-center font-medium">
                                        Zero setup required
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 text-sm self-center sm:mt-5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Join 50+ Top Agents
                                </div>
                            </div>
                        </div>

                        {/* Right — Animated mockup (desktop only — too wide for mobile) */}
                        <div className="hidden lg:block transition-all duration-[1.5s] delay-300"
                            style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0) scale(1)' : 'translateY(60px) scale(0.9)' }}>
                            <WebsiteMockup />
                        </div>
                    </div>
                </motion.div>

                {/* Scroll hint */}
                <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-600 transition-all duration-1000 delay-[1.5s]"
                    style={{ opacity: mounted ? heroOpacity : 0 }}>
                    <span className="text-[10px] tracking-[3px] uppercase font-medium">Scroll</span>
                    <div className="w-5 h-8 rounded-full border border-slate-700 flex items-start justify-center p-1.5">
                        <div className="w-1 h-2 rounded-full bg-indigo-400" style={{ animation: 'scrollDot 2s ease-in-out infinite' }} />
                    </div>
                </motion.div>
            </section>

            {/* ═══ SECTION 2 — THE PITCH ═══ */}
            <section className="relative overflow-hidden">
                {/* Top edge line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

                {/* Parallax background glow — desktop only, blur-[200px] is too heavy on mobile */}
                <motion.div className="hidden md:block absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[200px] opacity-10 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #6366f1, #7c3aed, transparent)', x: "-50%", y: parallaxGlowY }} />

                {/* Floating particles */}
                <FloatingParticles />

                {/* Cursor spotlight */}
                <CursorSpotlight />

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
                <motion.div className="max-w-6xl mx-auto px-6 md:px-12 py-32 relative"
                    viewport={{ margin: "0px 0px -200px 0px" }}>

                    {/* Vertical scroll progress beam — glows as you scroll */}
                    <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px">
                        <div className="absolute inset-0 bg-slate-800/30" />
                        <motion.div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-indigo-500 via-purple-500 to-indigo-500"
                            style={{
                                height: scrollBeamHeight,
                                boxShadow: '0 0 15px rgba(99,102,241,0.6), 0 0 40px rgba(99,102,241,0.2)',
                                transition: 'height 0.1s linear',
                            }} />
                        {/* Moving dot at the end of the beam */}
                        <motion.div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-indigo-400"
                            style={{
                                top: scrollBeamHeight,
                                boxShadow: '0 0 20px rgba(99,102,241,0.8), 0 0 60px rgba(99,102,241,0.4)',
                                transition: 'top 0.1s linear',
                                opacity: scrollBeamOpacity,
                            }} />
                    </div>

                    {/* Section Title — text scramble effect */}
                    <div ref={sectionTitle.ref} className="text-center mb-24 transition-all duration-[1.2s] ease-out relative z-10"
                        style={{
                            opacity: sectionTitle.isVisible ? 1 : 0,
                            transform: sectionTitle.isVisible ? 'translateY(0)' : 'translateY(60px)',
                        }}>
                        <span className="text-xs font-bold text-indigo-400 tracking-[4px] uppercase mb-5 block font-mono">
                            <TextScramble text="HOW IT WORKS" isVisible={sectionTitle.isVisible} delay={200} />
                        </span>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight font-heading">
                            <span className="inline-block transition-all duration-700 delay-300" style={{ opacity: sectionTitle.isVisible ? 1 : 0, transform: sectionTitle.isVisible ? 'translateY(0)' : 'translateY(30px)' }}>
                                Live in{' '}
                            </span>
                            <span className="inline-block transition-all duration-700 delay-500" style={{
                                opacity: sectionTitle.isVisible ? 1 : 0,
                                transform: sectionTitle.isVisible ? 'translateY(0)' : 'translateY(30px)',
                                background: 'linear-gradient(135deg, #818cf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                            }}>
                                three days.
                            </span>
                            <br className="hidden sm:block" />
                            <span className="inline-block text-slate-500 transition-all duration-700 delay-700" style={{ opacity: sectionTitle.isVisible ? 1 : 0, transform: sectionTitle.isVisible ? 'translateY(0)' : 'translateY(30px)' }}>
                                {' '}Not three months.
                            </span>
                        </h2>
                    </div>

                    {/* Timeline Cards — 3D tilt + staggered reveal */}
                    <div className="relative">
                        {/* Connecting line behind cards */}
                        <div className="hidden md:block absolute top-[60px] left-[16%] right-[16%] h-px"
                            style={{
                                background: `linear-gradient(90deg, ${card0.isVisible ? '#818cf8' : 'transparent'} 0%, ${card1.isVisible ? '#a78bfa' : 'transparent'} 50%, ${card2.isVisible ? '#c084fc' : 'transparent'} 100%)`,
                                boxShadow: card0.isVisible ? '0 0 10px rgba(129,140,248,0.3)' : 'none',
                                transition: 'all 1.5s ease-out',
                                opacity: card0.isVisible ? 0.8 : 0
                            }} />

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
                                <div key={i} ref={cardRefs[i].ref} className="relative transition-all ease-out"
                                    style={{
                                        opacity: cardRefs[i].isVisible ? 1 : 0,
                                        transform: cardRefs[i].isVisible
                                            ? 'translateY(0) scale(1) rotate(0deg)'
                                            : `translateY(100px) scale(0.9) rotate(${i === 0 ? -3 : i === 2 ? 3 : 0}deg)`,
                                        transitionDuration: '1.1s',
                                        transitionDelay: `${i * 250}ms`,
                                        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                                    }}>
                                    {/* Step number circle with orbiting ring */}
                                    <div className="relative z-10 w-[120px] h-[120px] mx-auto mb-6 flex flex-col items-center justify-center">
                                        {/* Orbiting ring */}
                                        <div className="absolute inset-0 rounded-full border border-dashed pointer-events-none"
                                            style={{
                                                borderColor: `${item.accent}20`,
                                                animation: `spin ${8 + i * 2}s linear infinite${i === 1 ? ' reverse' : ''}`,
                                            }}>
                                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                                                style={{ background: item.accent, boxShadow: `0 0 8px ${item.accent}` }} />
                                        </div>
                                        {/* Inner circle */}
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all duration-700"
                                            style={{
                                                borderColor: cardRefs[i].isVisible ? `${item.accent}60` : 'transparent',
                                                color: item.accent,
                                                background: `${item.accent}08`,
                                                boxShadow: cardRefs[i].isVisible ? `0 0 30px ${item.accent}30, inset 0 0 20px ${item.accent}10` : 'none',
                                            }}>
                                            {item.step}
                                        </div>
                                        <span className="text-[10px] font-bold tracking-[3px] uppercase mt-2" style={{ color: item.accent }}>
                                            {item.day}
                                        </span>
                                    </div>

                                    {/* 3D Tilt Card */}
                                    <TiltCard className="group">
                                        <div className="relative rounded-2xl border border-white/5 bg-white/[0.02] md:backdrop-blur-sm p-8 transition-all duration-500 hover:border-indigo-500/20 hover:bg-white/[0.04]"
                                            style={{ transformStyle: 'preserve-3d' }}>
                                            {/* Shine effect on hover */}
                                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                                                style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.05) 0%, transparent 50%, rgba(167,139,250,0.05) 100%)' }} />
                                            <h3 className="text-xl font-bold text-white mb-3 relative z-10" style={{ transform: 'translateZ(20px)' }}>{item.title}</h3>
                                            <p className="text-slate-400 text-sm leading-relaxed relative z-10" style={{ transform: 'translateZ(10px)' }}>{item.desc}</p>

                                            {/* Bottom glow on hover */}
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                                style={{ background: `linear-gradient(90deg, transparent, ${item.accent}50, transparent)`, boxShadow: `0 0 10px ${item.accent}30` }} />
                                        </div>
                                    </TiltCard>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── CTA Card — scroll reveal + breathing glow ── */}
                    <div ref={ctaReveal.ref} className="mt-32 relative flex items-center justify-center transition-all ease-out"
                        style={{
                            opacity: ctaReveal.isVisible ? 1 : 0,
                            transform: ctaReveal.isVisible ? 'translateY(0) scale(1)' : 'translateY(80px) scale(0.88)',
                            transitionDuration: '1.4s',
                            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                        }}>
                        {/* Breathing radial glow — desktop only, blur-[180px] is too heavy on mobile */}
                        <div className="hidden md:block absolute w-[600px] h-[600px] rounded-full blur-[180px] pointer-events-none"
                            style={{
                                background: 'radial-gradient(circle, #6366f1, #7c3aed, transparent)',
                                opacity: ctaReveal.isVisible ? 0.25 : 0,
                                transition: 'opacity 2s',
                                animation: ctaReveal.isVisible ? 'breathe 4s ease-in-out infinite' : 'none',
                            }} />

                        {/* Animated border ring — spin disabled on mobile */}
                        <div className="absolute w-[calc(100%+4px)] h-[calc(100%+4px)] rounded-[28px] pointer-events-none"
                            style={{
                                background: 'conic-gradient(from 0deg, #6366f1, #a78bfa, #c084fc, #6366f1)',
                                animation: isMobile ? 'none' : 'spin 6s linear infinite',
                                filter: 'blur(1px)',
                                opacity: ctaReveal.isVisible ? 0.6 : 0,
                                transition: 'opacity 1.5s',
                            }} />

                        {/* Card */}
                        <TiltCard className="relative max-w-2xl w-full">
                            <div className="rounded-[26px] bg-slate-950/90 md:backdrop-blur-xl px-8 md:px-16 py-16 text-center border border-white/5">
                                {/* Inner glow line */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

                                <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 font-heading">
                                    <TextScramble text="Ready to stand out?" isVisible={ctaReveal.isVisible} delay={400} />
                                </h2>
                                <p className="text-base md:text-lg text-slate-400 mb-10 max-w-md mx-auto leading-relaxed">
                                    Tell us about your business and we'll build you a customer acquisition system that turns visitors into clients.
                                </p>

                                {/* Form trigger button */}
                                <button
                                    onClick={() => { setShowIntakeForm(true); if (typeof window !== 'undefined' && (window as any).gtag) (window as any).gtag('event', 'cta_click', { location: 'bottom_cta' }); }}
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
                                        Get Started, It's Free
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
                        </TiltCard>
                    </div>
                </motion.div>
            </section>

            {/* Pricing Section */}
            <section className="relative z-20 py-24 px-6">
                <div className="max-w-lg mx-auto text-center">
                    <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-4">Pricing</p>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Simple pricing</h2>
                    <p className="text-slate-400 mb-12 text-lg">Start free for 30 days. No credit card required.</p>
                    <div className="bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-10 shadow-xl shadow-indigo-500/10 text-left">
                        <div className="flex items-end gap-1 mb-2">
                            <span className="text-5xl font-bold tracking-tight">$49</span>
                            <span className="text-slate-400 text-lg mb-2">/month</span>
                        </div>
                        <p className="text-indigo-400 text-sm font-semibold mb-8">After your free 30-day trial</p>
                        <ul className="space-y-3 mb-10">
                            {['Custom-built website, your brand', 'Lead capture forms → go directly to you', 'Automated email follow-up sequences', 'Admin dashboard — edit anything', 'Custom domain connection', 'Cancel anytime'].map((f, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                                    <span className="text-indigo-400 font-bold">✓</span>{f}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => { setShowIntakeForm(true); if (typeof window !== 'undefined' && (window as any).gtag) (window as any).gtag('event', 'cta_click', { location: 'pricing_section' }); }}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors duration-200 text-base"
                        >
                            Start Free — No Credit Card
                        </button>
                        <p className="text-center text-xs text-slate-600 mt-3">Cancel anytime &nbsp;·&nbsp; <a href="/pricing" className="text-indigo-500 hover:text-indigo-400">See full pricing details →</a></p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-20 border-t border-white/5 bg-slate-950/90 md:backdrop-blur-xl">
                <div className="container mx-auto px-6 max-w-6xl py-12">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        {/* Brand */}
                        <div className="flex flex-col items-center md:items-start gap-2">
                            <span className="text-2xl font-black tracking-tighter text-white font-heading">
                                site<span style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>o</span>
                            </span>
                            <p className="text-slate-600 text-xs">Websites that work while you sleep.</p>
                        </div>

                        {/* Links */}
                        <div className="flex items-center gap-8 text-sm text-slate-500">
                            <a href="/pricing" className="hover:text-indigo-400 transition-colors duration-200">
                                Pricing
                            </a>
                            <a href="/privacy" className="hover:text-indigo-400 transition-colors duration-200">
                                Privacy Policy
                            </a>
                            <a href="mailto:siteoteam@gmail.com" className="hover:text-indigo-400 transition-colors duration-200">
                                siteoteam@gmail.com
                            </a>
                            <a href="tel:+16268849546" className="hover:text-indigo-400 transition-colors duration-200">
                                (626) 884-9546
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
                @keyframes floatParticle {
                    0% { transform: translateY(0px) translateX(0px); }
                    33% { transform: translateY(-20px) translateX(10px); }
                    66% { transform: translateY(-10px) translateX(-10px); }
                    100% { transform: translateY(-30px) translateX(5px); }
                }
                @keyframes breathe {
                    0%, 100% { transform: scale(1); opacity: 0.2; }
                    50% { transform: scale(1.15); opacity: 0.35; }
                }
            `}</style>
        </main>
    )
}
