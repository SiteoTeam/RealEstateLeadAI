import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { Mail, Phone, MapPin, Linkedin, Facebook, Instagram, Twitter, Youtube, TrendingUp, ArrowDown, Home, BarChart2, Building, BadgeCheck, Minus } from 'lucide-react'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import { getWebsiteBySlug, type DBProfile } from '../services/api'
import { getThemeConfig } from '../utils/theme'
import { FloatingNavbar } from '../components/website/FloatingNavbar'
import { ContactForm } from '../components/website/ContactForm'
import { ServiceModal, type ServiceType } from '../components/website/ServiceModal'
import { BookingModal } from '../components/website/BookingModal'
// Admin Imports
import { EditableText } from '../components/admin/EditableText'
import { VisualEditorToolbar } from '../components/admin/VisualEditorToolbar'
import { adminApi } from '../services/adminApi'
import { useHistory } from '../hooks/useHistory'

export function PublicWebsite({ slug: propSlug }: { slug?: string }) {
    const { slug: paramSlug } = useParams<{ slug: string }>()
    const slug = propSlug || paramSlug
    const [searchParams] = useSearchParams()

    // Data State
    const [agent, setAgent] = useState<DBProfile | null>(null)
    const [savedConfig, setSavedConfig] = useState<any>({}) // Reference for dirty check
    const { state: localConfig, setState: setLocalConfig, undo, redo, canUndo, canRedo, reset } = useHistory<any>({})

    // Preview Notice State
    const [showPreviewNotice, setShowPreviewNotice] = useState(false)

    useEffect(() => {
        const source = searchParams.get('source')
        const hasSeen = localStorage.getItem('has_seen_preview_notice')

        // Debug log
        console.log('[PreviewNotice] Check:', { source, hasSeen })

        if ((source === 'email' || source === 'audit') && !hasSeen) {
            console.log('[PreviewNotice] Showing notice')
            setShowPreviewNotice(true)
            // removing immediate setItem to allow persistence until dismissed
        }
    }, [searchParams])

    const handleDismissNotice = () => {
        setShowPreviewNotice(false)
        localStorage.setItem('has_seen_preview_notice', 'true')
    }


    // UI State
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeModal, setActiveModal] = useState<ServiceType | null>(null)
    const [bookingOpen, setBookingOpen] = useState(false)

    // Admin State
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)


    // Stripe Checkout Handler
    // Handle claim removed


    // Handle Payment Success
    useEffect(() => {
        if (searchParams.get('success') === 'true') {
            alert("Payment successful! Welcome to Siteo Pro. Your site is now live.")
            // Clean URL
            const url = new URL(window.location.href);
            url.searchParams.delete('success');
            url.searchParams.delete('session_id');
            window.history.replaceState({}, '', url);
        }
    }, [searchParams])

    // Derived State
    const isDirty = useMemo(() => {
        return JSON.stringify(localConfig) !== JSON.stringify(savedConfig)
    }, [localConfig, savedConfig])

    // Init Logic
    useEffect(() => {
        async function fetchAgent() {
            if (!slug) return
            try {
                const data = await getWebsiteBySlug(slug)
                setAgent(data)

                // Dynamic Title & Favicon
                if (data.full_name) {
                    document.title = data.full_name

                    // Generate Favicon
                    const canvas = document.createElement('canvas')
                    canvas.width = 32
                    canvas.height = 32
                    const ctx = canvas.getContext('2d')
                    if (ctx) {
                        // Background
                        ctx.fillStyle = '#6366f1' // Indigo-500
                        ctx.beginPath()
                        ctx.arc(16, 16, 16, 0, 2 * Math.PI)
                        ctx.fill()

                        // Initials
                        ctx.fillStyle = 'white'
                        ctx.font = 'bold 14px Inter, sans-serif'
                        ctx.textAlign = 'center'
                        ctx.textBaseline = 'middle'
                        const initials = data.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                        ctx.fillText(initials, 16, 17)

                        // Update Link Tag
                        const link = (document.querySelector("link[rel*='icon']") as HTMLLinkElement) || document.createElement('link')
                        link.type = 'image/png'
                        link.rel = 'icon'
                        link.href = canvas.toDataURL()
                        document.getElementsByTagName('head')[0].appendChild(link)
                    }
                }

                const defaultTestimonials = [
                    { quote: `${data.full_name.split(' ')[0]} was incredible to work with. The attention to detail and market knowledge made selling our home effortless.`, name: "James Peterson", location: "Dallas, TX", initials: "JP" },
                    { quote: `We found our dream home thanks to ${data.full_name}'s persistence and dedication. Highly recommended!`, name: "Sarah Mitchell", location: "Frisco, TX", initials: "SM" },
                    { quote: "Professional, knowledgeable, and always available. The best real estate experience we've ever had.", name: "Michael Chen", location: "Plano, TX", initials: "MC" },
                    { quote: "Truly went above and beyond to ensure we got the best deal possible.", name: "Emily Rodriguez", location: "Fort Worth, TX", initials: "ER" }
                ];

                const config = data.website_config || {};

                // Seed default testimonials if missing
                if (!config.testimonials || config.testimonials.length === 0) {
                    config.testimonials = defaultTestimonials;
                }

                setSavedConfig(config)
                reset(config)


                // Check if editing is requested and allowed
                const token = localStorage.getItem(`admin_token_${slug}`)
                if (searchParams.get('edit') === 'true' && token) {
                    setIsEditing(true)
                }
            } catch (err: any) {
                setError(err.message || 'Website not found')
            } finally {
                setLoading(false)
            }
        }


        fetchAgent()
    }, [slug, searchParams])

    // Update Handler
    const updateConfig = (keyOrUpdates: string | Record<string, any>, value?: any) => {
        // useHistory's setState automatically pushes to history
        // We create a new object to ensure memory reference changes
        if (typeof keyOrUpdates === 'string') {
            setLocalConfig({ ...localConfig, [keyOrUpdates]: value })
        } else {
            setLocalConfig({ ...localConfig, ...keyOrUpdates })
        }
    }

    // Testimonial Helpers
    const handleTestimonialChange = (index: number, field: string, value: string) => {
        const currentTestimonials = [...(localConfig.testimonials || [])];
        if (!currentTestimonials[index]) return;

        currentTestimonials[index] = { ...currentTestimonials[index], [field]: value };
        // Clean up initials if name changes
        if (field === 'name') {
            const parts = value.split(' ');
            if (parts.length >= 2) {
                currentTestimonials[index].initials = `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
            } else if (parts.length === 1) {
                currentTestimonials[index].initials = parts[0].substring(0, 2).toUpperCase();
            }
        }

        updateConfig('testimonials', currentTestimonials);
    }

    const addTestimonial = () => {
        const newTestimonial = {
            quote: "Enter your client's testimonial here...",
            name: "Client Name",
            location: "City, State",
            initials: "CN"
        };
        const currentTestimonials = [...(localConfig.testimonials || [])];
        updateConfig('testimonials', [...currentTestimonials, newTestimonial]);
    }

    const removeTestimonial = (index: number) => {
        const currentTestimonials = [...(localConfig.testimonials || [])];
        currentTestimonials.splice(index, 1);
        updateConfig('testimonials', currentTestimonials);
    }

    // Keyboard Shortcuts for Undo/Redo
    useEffect(() => {
        if (!isEditing) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey) {
                if (e.key === 'z') {
                    if (e.shiftKey) {
                        e.preventDefault()
                        redo()
                    } else {
                        e.preventDefault()
                        undo()
                    }
                } else if (e.key === 'y') {
                    e.preventDefault()
                    redo()
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isEditing, undo, redo])

    // Save Handler
    const handleSave = async () => {
        if (!slug || !isDirty || !agent) return
        setIsSaving(true)
        try {
            const token = localStorage.getItem(`admin_token_${slug}`)
            if (token) {
                // Fix: pass agent.id as first arg, config as second, token as third
                await adminApi.updateConfig(agent.id, localConfig, token)
                setSavedConfig(localConfig) // Update reference state
            }
        } catch (err) {
            console.error('Failed to save', err)
            alert('Failed to save changes')
        } finally {
            setIsSaving(false)
        }
    }

    // --- UI HOOKS ---
    const heroRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"]
    })

    // Smooth spring for parallax
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })

    // Parallax transforms - Name moves slower (behind), Image moves faster
    const nameY = useTransform(smoothProgress, [0, 1], [0, -100])
    const imageY = useTransform(smoothProgress, [0, 1], [0, 150])
    const contentOpacity = useTransform(smoothProgress, [0, 0.5], [1, 0])
    const contentScale = useTransform(smoothProgress, [0, 0.5], [1, 0.9])

    const theme = useMemo(() => {
        if (!agent) return getThemeConfig(null, null)
        return getThemeConfig(agent.city, agent.state)
    }, [agent])



    // Trial Logic
    const trialDays = 30
    const trialStarted = agent?.trial_started_at ? new Date(agent.trial_started_at) : null
    const now = new Date()
    let isExpired = false

    if (trialStarted) {
        const expiresAt = new Date(trialStarted.getTime() + trialDays * 24 * 60 * 60 * 1000)
        const diffTime = expiresAt.getTime() - now.getTime()
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        if (daysLeft <= 0) isExpired = true
    }

    // Block Expired (Unpublished) Sites
    if (!loading && agent && isExpired && !agent.is_paid && !isEditing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
                <div className="text-center p-8 max-w-md">
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Minus className="w-8 h-8 text-slate-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Website Unpublished</h1>
                    <p className="text-slate-600 mb-8">This website's trial period has expired. If you are the owner, please log in to activate your plan and restore access.</p>
                    <a
                        href={`/w/${slug}/admin/login`}
                        className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Owner Login
                    </a>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
        )
    }

    if (error || !agent) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
                <h1 className="text-4xl font-bold mb-4">Website Not Found</h1>
                <p className="text-slate-400">This agent website doesn't exist or isn't published yet.</p>
                <div className="mt-8 p-4 bg-slate-900 rounded-lg border border-slate-800 text-left max-w-md w-full">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-2">Debug Info</p>
                    <p className="text-sm text-red-400 font-mono break-all">Error: {error}</p>
                    <p className="text-sm text-slate-400 font-mono mt-1">Slug: {slug}</p>
                </div>
            </div>
        )
    }



    return (
        <GoogleReCaptchaProvider reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}>
            <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] overflow-x-hidden"
                style={{
                    fontFamily: "'Inter', sans-serif",
                    // @ts-ignore
                    "--primary": localConfig.primaryColor || theme.primaryColor || '#14b8a6',
                    // @ts-ignore
                    "--secondary": localConfig.secondaryColor || '#0f766e',
                    // Explicitly set Tailwind variables to ensure they override the theme defaults
                    // @ts-ignore
                    "--color-primary": localConfig.primaryColor || theme.primaryColor || '#14b8a6',
                    // @ts-ignore
                    "--color-secondary": localConfig.secondaryColor || '#0f766e',
                    // Theme Variables (Dynamic Dark Mode)
                    // @ts-ignore
                    "--bg-main": localConfig.bgMain || '#ffffff',
                    // @ts-ignore
                    "--bg-alt": localConfig.bgAlt || '#f8fafc', // slate-50
                    // @ts-ignore
                    "--text-main": localConfig.textMain || '#0f172a', // slate-900
                    // @ts-ignore
                    "--text-muted": localConfig.textMuted || '#64748b', // slate-500
                    // @ts-ignore
                    "--text-inv": localConfig.textInv || '#ffffff'
                }}
            >
                <FloatingNavbar agent={agent} onBookClick={() => setBookingOpen(true)} />

                {isEditing && (
                    <VisualEditorToolbar
                        isDirty={isDirty}
                        onSave={handleSave}
                        saving={isSaving}
                        config={localConfig}
                        agent={agent}
                        onUpdateConfig={updateConfig}
                        undo={undo}
                        redo={redo}
                        canUndo={canUndo}
                        canRedo={canRedo}
                    />
                )}

                {/* Preview Notice Subtitle (One-time) */}
                {showPreviewNotice && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="fixed top-24 left-0 right-0 z-40 pointer-events-none flex justify-center px-4"
                    >
                        <div className="bg-white/90 backdrop-blur-md border border-indigo-100 shadow-xl rounded-full px-6 py-2.5 flex items-center gap-3 pointer-events-auto">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                <BadgeCheck className="w-3.5 h-3.5 text-green-600" />
                            </div>
                            <div className="text-sm font-medium text-slate-700">
                                Private Access Enabled. <span className="text-slate-500 font-normal">Your secure admin link has been sent to your email.</span>
                            </div>
                            <button
                                onClick={handleDismissNotice}
                                className="ml-2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ===== HERO SECTION - "Editorial Depth" ===== */}
                <section
                    ref={heroRef}
                    id="hero"
                    className="relative min-h-[120vh] flex items-center justify-center overflow-hidden"
                >
                    {/* Background Image */}
                    <div className="absolute inset-0 z-0">
                        <img
                            src={theme.heroImage}
                            alt="Background"
                            className="w-full h-full object-cover opacity-90"
                        />
                        {/* Gradient Overlay for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-main)]/90 via-[var(--bg-main)]/50 to-secondary/10" />
                    </div>

                    {/* Large Name Behind (Parallax Layer 1) */}
                    <motion.div
                        style={{ y: nameY }}
                        className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none select-none"
                    >
                        <h1
                            className="text-[12vw] md:text-[14vw] lg:text-[12vw] font-bold text-[var(--text-main)]/20 uppercase tracking-tighter text-center leading-[0.8] mix-blend-overlay"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            {agent.full_name}
                        </h1>
                    </motion.div>

                    {/* Headshot (Parallax Layer 2 - In Front) */}
                    <motion.div
                        style={{ y: imageY, opacity: contentOpacity, scale: contentScale }}
                        className="relative z-20 text-center px-6"
                    >
                        {agent.headshot_url ? (
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                                className="relative"
                            >
                                {/* Decorative Ring */}
                                <div className="absolute -inset-4 rounded-full border-2 border-primary/30 animate-pulse" />
                                <div className="w-56 h-56 md:w-72 md:h-72 mx-auto rounded-full overflow-hidden border-4 border-[var(--bg-main)] shadow-2xl shadow-[var(--text-main)]/20">
                                    <img
                                        src={localConfig.headshotUrl || agent.headshot_url}
                                        alt={agent.full_name}
                                        className="w-full h-full object-cover object-top"
                                    />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="w-56 h-56 md:w-72 md:h-72 mx-auto rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-2xl"
                            >
                                <span
                                    className="text-7xl font-bold text-slate-300"
                                    style={{ fontFamily: "'Playfair Display', serif" }}
                                >
                                    {agent.full_name[0]}
                                </span>
                            </motion.div>
                        )}

                        {/* Info Below Photo */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="mt-8 relative"
                        >
                            {/* Text Shadow for readability */}
                            <div className="absolute inset-0 bg-[var(--bg-main)]/40 blur-xl -z-10 rounded-full scale-150 opacity-60"></div>

                            <p className="text-sm uppercase tracking-[0.3em] text-primary font-bold mb-2 drop-shadow-sm">
                                {agent.brokerage}
                            </p>
                            <h2
                                className="text-3xl md:text-4xl font-bold text-[var(--text-main)] mb-2 drop-shadow-sm"
                                style={{ fontFamily: "'Playfair Display', serif" }}
                            >
                                <EditableText
                                    value={localConfig.customTitle || agent.full_name}
                                    isEditing={isEditing}
                                    onChange={(val) => updateConfig('customTitle', val)}
                                />
                            </h2>
                            <p className="text-[var(--text-main)]/90 font-medium flex items-center justify-center gap-2 drop-shadow-sm">
                                <MapPin className="w-4 h-4 text-[var(--text-muted)]" />
                                {agent.city}, {agent.state}
                            </p>
                        </motion.div>

                        {/* CTA Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="mt-8"
                        >
                            <a
                                href="#contact"
                                className="inline-flex items-center gap-3 px-8 py-4 bg-[var(--text-main)] text-[var(--bg-main)] font-semibold rounded-full hover:bg-primary hover:text-white transition-all shadow-lg hover:shadow-xl group"
                                onClick={(e) => isEditing && e.preventDefault()}
                            >
                                <Mail className="w-5 h-5" />
                                <EditableText
                                    value={localConfig.heroCtaText || "Get in Touch"}
                                    isEditing={isEditing}
                                    onChange={val => updateConfig('heroCtaText', val)}
                                />
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                            </a>
                        </motion.div>
                    </motion.div>

                    {/* Scroll Indicator */}
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30"
                    >
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                            <span className="text-xs uppercase tracking-widest">Scroll</span>
                            <ArrowDown className="w-4 h-4" />
                        </div>
                    </motion.div>
                </section>

                {/* ===== SERVICES SECTION - "Signature Approach" ===== */}
                <section id="services" className="py-32 px-6 bg-[var(--bg-main)] relative overflow-hidden">
                    {/* Subtle Background Number */}
                    <div className="absolute top-20 right-0 text-[20rem] font-bold text-[var(--text-main)]/5 leading-none select-none pointer-events-none -mr-20"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        01
                    </div>

                    <div className="max-w-7xl mx-auto relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            className="text-left mb-20 max-w-2xl"
                        >
                            <span className="text-sm uppercase tracking-[0.3em] text-primary font-bold">
                                <EditableText
                                    value={localConfig.servicesKicker || "My Signature Approach"}
                                    isEditing={isEditing}
                                    onChange={val => updateConfig('servicesKicker', val)}
                                />
                            </span>
                            <h2
                                className="text-5xl md:text-6xl font-bold text-[var(--text-main)] mt-6 mb-6 leading-tight"
                                style={{ fontFamily: "'Playfair Display', serif" }}
                            >
                                <EditableText
                                    value={localConfig.servicesTitle || "Elevating the standard of real estate."}
                                    isEditing={isEditing}
                                    onChange={val => updateConfig('servicesTitle', val)}
                                />
                            </h2>
                            <p className="text-lg text-[var(--text-muted)] leading-relaxed">
                                <EditableText
                                    value={localConfig.servicesDesc || "Buying or selling a home is more than a transaction—it's a life-changing experience. I combine market intelligence with creative storytelling to deliver results that move you."}
                                    isEditing={isEditing}
                                    onChange={val => updateConfig('servicesDesc', val)}
                                    multiline
                                />
                            </p>
                        </motion.div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                {
                                    icon: TrendingUp,
                                    title: "Selling Your Home",
                                    type: 'selling' as ServiceType,
                                    desc: "Strategic pricing, high-end presentation, and targeted exposure designed to attract qualified buyers and maximize your final sale price without unnecessary delays."
                                },
                                {
                                    icon: Home,
                                    title: "Buying a Home",
                                    type: 'buying' as ServiceType,
                                    desc: "From sourcing off-market opportunities to negotiating from a position of strength, I help you secure the right home at the right terms without overpaying."
                                },
                                {
                                    icon: BarChart2,
                                    title: "Home Valuation",
                                    type: 'valuation' as ServiceType,
                                    desc: "A data-backed valuation that goes beyond online estimates, factoring in timing, buyer demand, and local market dynamics to determine what your home can realistically command."
                                }
                            ].map((service, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ delay: i * 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                    className="group relative p-10 bg-[var(--bg-alt)] rounded-[2rem] hover:bg-[var(--text-main)] transition-colors duration-500 overflow-hidden"
                                >
                                    {/* Hover Gradient Blob */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                    <div className="relative z-10">
                                        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-main)] flex items-center justify-center mb-8 shadow-sm group-hover:bg-primary transition-colors duration-500">
                                            <service.icon className="w-7 h-7 text-primary group-hover:text-white transition-colors duration-500" />
                                        </div>

                                        <h3
                                            className="text-2xl font-bold mb-4 text-[var(--text-main)] group-hover:text-[var(--bg-main)] transition-colors duration-500"
                                            style={{ fontFamily: "'Playfair Display', serif" }}
                                        >
                                            <EditableText
                                                value={localConfig[`serviceTitle${i}`] || service.title}
                                                isEditing={isEditing}
                                                onChange={val => updateConfig(`serviceTitle${i}`, val)}
                                            />
                                        </h3>

                                        <div className="text-[var(--text-muted)] leading-relaxed group-hover:text-[var(--bg-alt)] transition-colors duration-500">
                                            <EditableText
                                                value={localConfig[`serviceDesc${i}`] || service.desc}
                                                isEditing={isEditing}
                                                onChange={val => updateConfig(`serviceDesc${i}`, val)}
                                                multiline
                                            />
                                        </div>

                                        <button
                                            onClick={() => setActiveModal(service.type)}
                                            className="mt-8 pt-8 border-t border-[var(--bg-alt)] group-hover:border-[var(--bg-main)]/20 transition-colors duration-500 flex items-center gap-2 text-sm font-bold text-[var(--text-main)] group-hover:text-[var(--bg-main)] opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 bg-transparent cursor-pointer"
                                        >
                                            Get Started <ArrowDown className="w-4 h-4 -rotate-90" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ===== ABOUT SECTION (Modern Split) ===== */}
                <section id="about" className="py-24 md:py-32 px-6 bg-[var(--bg-alt)] relative overflow-hidden">
                    {/* Decorative Background Text */}
                    <div className="absolute top-20 left-0 opacity-[0.03] pointer-events-none select-none overflow-hidden w-full">
                        <span
                            className="text-[12rem] md:text-[20rem] font-bold text-[var(--text-main)] leading-none -ml-20"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            About
                        </span>
                    </div>

                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="grid md:grid-cols-12 gap-12 lg:gap-24 items-start">
                            {/* LEFT COLUMN: Headshot & Quick Info (Sticky on Desktop) */}
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="md:col-span-5 lg:col-span-4 md:sticky md:top-32"
                            >
                                {/* Headshot Card */}
                                <div className="relative mb-8 group perspective-1000 max-w-xs mx-auto md:max-w-none">
                                    <div className="absolute -inset-3 bg-gradient-to-tr from-secondary/20 to-transparent rounded-[2rem] -rotate-2 group-hover:rotate-0 transition-transform duration-500"></div>
                                    <div className="relative rounded-[1.5rem] overflow-hidden shadow-2xl aspect-[3/4] bg-[var(--bg-main)]">
                                        {agent.headshot_url ? (
                                            <img
                                                src={localConfig.headshotUrl || agent.headshot_url}
                                                alt={agent.full_name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300 text-8xl font-serif">
                                                {agent.full_name[0]}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Extended Info Card */}
                                <div className="bg-[var(--bg-main)]/95 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-[var(--bg-alt)] space-y-5">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Phone className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold mb-0.5">Mobile</p>
                                            <a href={`tel:${localConfig.contactPhone || agent.primary_phone}`} className="font-medium text-[var(--text-main)] hover:text-primary transition-colors">
                                                {localConfig.contactPhone || agent.primary_phone || '—'}
                                            </a>
                                        </div>
                                    </div>



                                    {(localConfig.officePhone || (agent.office_phone && agent.office_phone !== '(200) 000-0000')) && (
                                        <div className="flex items-start gap-4 pt-4 border-t border-[var(--bg-alt)]">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Building className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold mb-0.5">Office</p>
                                                <p className="font-medium text-[var(--text-main)]">{localConfig.officePhone || agent.office_phone}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-4 pt-4 border-t border-[var(--bg-alt)]">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Mail className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold mb-0.5">Email</p>
                                            <a href={`mailto:${localConfig.contactEmail || agent.primary_email}`} className="font-medium text-[var(--text-main)] hover:text-primary transition-colors break-all block">
                                                {localConfig.contactEmail || agent.primary_email || '—'}
                                            </a>
                                        </div>
                                    </div>

                                    {(localConfig.licenseNumber || agent.license_number) && (
                                        <div className="flex items-start gap-4 pt-4 border-t border-[var(--bg-alt)]">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <BadgeCheck className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold mb-0.5">License #</p>
                                                <p className="font-medium text-[var(--text-main)]">{localConfig.licenseNumber || agent.license_number}</p>
                                            </div>
                                        </div>
                                    )}

                                    {agent.office_address && (
                                        <div className="flex items-start gap-4 pt-4 border-t border-[var(--bg-alt)]">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <MapPin className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold mb-0.5">Office Address</p>
                                                <p className="font-medium text-[var(--text-main)] text-sm leading-snug">{agent.office_address}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* RIGHT COLUMN: Bio & Narrative */}
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                                className="md:col-span-7 lg:col-span-8"
                            >
                                <div className="mb-10">
                                    <span className="text-primary font-bold tracking-[0.2em] text-sm uppercase flex items-center gap-3 mb-4">
                                        <span className="w-10 h-[1px] bg-primary"></span>
                                        <EditableText
                                            value={localConfig.aboutKicker || `About ${agent.full_name.split(' ')[0]}`}
                                            isEditing={isEditing}
                                            onChange={(val) => updateConfig('aboutKicker', val)}
                                        />
                                    </span>
                                    <h2
                                        className="text-5xl md:text-6xl lg:text-7xl font-bold text-[var(--text-main)] leading-[0.9]"
                                        style={{ fontFamily: "'Playfair Display', serif" }}
                                    >
                                        <EditableText
                                            value={localConfig.bioHeadlinePrefix || "Real estate"}
                                            isEditing={isEditing}
                                            onChange={(val) => updateConfig('bioHeadlinePrefix', val)}
                                        />
                                        <br />
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                                            <EditableText
                                                value={localConfig.bioHeadline || "redefined."}
                                                isEditing={isEditing}
                                                onChange={(val) => updateConfig('bioHeadline', val)}
                                            />
                                        </span>
                                    </h2>
                                </div>

                                <div className="prose prose-lg max-w-none text-[var(--text-muted)] prose-headings:text-[var(--text-main)] prose-strong:text-[var(--text-main)] prose-p:text-[var(--text-muted)]">
                                    <EditableText
                                        value={localConfig.customBio || agent.bio || ""}
                                        isEditing={isEditing}
                                        onChange={(val) => updateConfig('customBio', val)}
                                        multiline
                                    />
                                </div>

                                <div className="mt-12 pt-8 border-t border-[var(--bg-alt)] grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-[var(--text-main)] font-bold text-lg mb-1">{agent.brokerage}</p>
                                        <p className="text-[var(--text-muted)] text-sm">
                                            <EditableText
                                                value={localConfig.aboutBrokerageLabel || "Brokerage"}
                                                isEditing={isEditing}
                                                onChange={val => updateConfig('aboutBrokerageLabel', val)}
                                            />
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[var(--text-main)] font-bold text-lg mb-1">
                                            <EditableText
                                                value={localConfig.aboutExpertTitle || "Local Expert"}
                                                isEditing={isEditing}
                                                onChange={val => updateConfig('aboutExpertTitle', val)}
                                            />
                                        </p>
                                        <p className="text-[var(--text-muted)] text-sm">
                                            <EditableText
                                                value={localConfig.aboutSpecializationLabel || "Specialization"}
                                                isEditing={isEditing}
                                                onChange={val => updateConfig('aboutSpecializationLabel', val)}
                                            />
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ===== TESTIMONIALS SECTION ===== */}
                <section className="py-32 px-6 bg-[var(--bg-alt)] relative overflow-hidden">
                    <div className="max-w-5xl mx-auto relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <span className="text-sm uppercase tracking-[0.3em] text-primary font-semibold">Testimonials</span>
                            <h2
                                className="text-4xl md:text-5xl font-bold text-[var(--text-main)] mt-4"
                                style={{ fontFamily: "'Playfair Display', serif" }}
                            >
                                Client Stories
                            </h2>
                        </motion.div>

                        {/* Scrolling Marquee Container */}
                        <div className="relative w-full overflow-hidden mask-linear-fade">
                            {/* Edit Mode Controls */}
                            {isEditing && (
                                <div className="absolute top-4 right-4 z-50">
                                    <button
                                        onClick={addTestimonial}
                                        className="px-4 py-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition flex items-center gap-2 font-medium"
                                    >
                                        <span className="text-xl">+</span> Add Testimonial
                                    </button>
                                </div>
                            )}

                            {/* Left/Right Fade Masks */}
                            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--bg-alt)] to-transparent z-10 pointer-events-none" />
                            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--bg-alt)] to-transparent z-10 pointer-events-none" />

                            <motion.div
                                className="flex gap-8 w-max"
                                animate={isEditing ? { x: 0 } : { x: "-50%" }} // PAUSE animation when editing
                                transition={{
                                    duration: isEditing ? 0 : 40,
                                    repeat: isEditing ? 0 : Infinity,
                                    ease: "linear",
                                    repeatType: "loop"
                                }}
                                style={{ x: isEditing ? 0 : undefined }} // Force stop
                            >
                                {/* Duplicate items for seamless loop (or just single list if editing/short) */}
                                {((): any[] => {
                                    const list = localConfig.testimonials || [];
                                    // If editing or list is short, maybe don't duplicate? But for visual consistency we should.
                                    // However, editing duplicates is confusing.
                                    // If editing, let's SHOW ONLY THE REAL LIST?
                                    // If I show only real list, the layout shifts.
                                    // Compromise: If isEditing, show only REAL list and allow horizontal scroll if needed.
                                    return isEditing ? list : [...list, ...list];
                                })().map((testimonial, i) => {
                                    // If duplicates are rendered, the second half indices (i >= length) map to i % length
                                    const realIndex = i % (localConfig.testimonials?.length || 1);
                                    const isDuplicate = isEditing ? false : i >= (localConfig.testimonials?.length || 1);

                                    // Don't allow editing duplicates (it's confusing)
                                    const canEditThis = isEditing && !isDuplicate;

                                    return (
                                        <motion.div
                                            key={i}
                                            whileHover={{ scale: 1.02, y: -5 }}
                                            className="w-[400px] p-8 bg-[var(--bg-main)] rounded-3xl shadow-sm border border-[var(--bg-alt)] flex-shrink-0 relative group hover:shadow-xl transition-all duration-300"
                                        >
                                            {canEditThis && (
                                                <button
                                                    onClick={() => removeTestimonial(realIndex)}
                                                    className="absolute top-4 right-4 p-2 bg-red-500/10 text-red-500 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all z-50"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                            )}

                                            <span
                                                className="absolute top-6 left-6 text-6xl text-primary/10 font-serif leading-none group-hover:text-primary/20 transition-colors"
                                                style={{ fontFamily: "'Playfair Display', serif" }}
                                            >
                                                "
                                            </span>
                                            <div className="text-[var(--text-muted)] leading-relaxed mb-6 relative z-10 pt-6 italic">
                                                <EditableText
                                                    value={testimonial.quote}
                                                    isEditing={canEditThis}
                                                    onChange={(val) => handleTestimonialChange(realIndex, 'quote', val)}
                                                    multiline
                                                />
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-[var(--bg-alt)] flex items-center justify-center font-bold text-[var(--text-muted)] text-sm group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                                    {testimonial.initials || '??'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-[var(--text-main)]">
                                                        <EditableText
                                                            value={testimonial.name}
                                                            isEditing={canEditThis}
                                                            onChange={(val) => handleTestimonialChange(realIndex, 'name', val)}
                                                        />
                                                    </p>
                                                    <p className="text-sm text-[var(--text-muted)]">
                                                        <EditableText
                                                            value={testimonial.location}
                                                            isEditing={canEditThis}
                                                            onChange={(val) => handleTestimonialChange(realIndex, 'location', val)}
                                                        />
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ===== CONTACT SECTION - REDESIGNED (Dynamic Theme) ===== */}
                <section id="contact" className="py-24 px-6 bg-[var(--bg-main)] relative overflow-hidden">
                    {/* Decorative Background Text */}
                    <div className="absolute top-20 right-0 opacity-[0.03] pointer-events-none select-none overflow-hidden w-full text-right">
                        <span
                            className="text-[12rem] md:text-[20rem] font-bold text-[var(--text-main)] leading-none -mr-20"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                            Contact
                        </span>
                    </div>

                    <div className="max-w-7xl mx-auto relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-16"
                        >
                            <span className="text-sm uppercase tracking-[0.3em] text-primary font-semibold">
                                <EditableText
                                    value={localConfig.contactKicker || "Ready to Connect?"}
                                    isEditing={isEditing}
                                    onChange={val => updateConfig('contactKicker', val)}
                                />
                            </span>
                            <h2
                                className="text-5xl md:text-6xl font-bold text-[var(--text-main)] mt-4"
                                style={{ fontFamily: "'Playfair Display', serif" }}
                            >
                                <EditableText
                                    value={localConfig.contactTitle || "Let's Talk"}
                                    isEditing={isEditing}
                                    onChange={val => updateConfig('contactTitle', val)}
                                />
                            </h2>
                        </motion.div>

                        <div className="grid lg:grid-cols-2 gap-12 items-start">
                            {/* LEFT COLUMN: Contact Form */}
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="relative"
                            >
                                <ContactForm
                                    agentId={agent.id}
                                    agentName={agent.full_name}
                                />
                            </motion.div>

                            {/* RIGHT COLUMN: Map & Info */}
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                                className="space-y-8"
                            >
                                {/* Google Map Embed */}
                                {(agent.city && agent.city !== 'Unknown' && agent.state && agent.state !== 'XX') && (
                                    <div className="relative h-80 w-full rounded-3xl overflow-hidden shadow-lg border border-slate-100 group">
                                        <iframe
                                            title="Office Location"
                                            width="100%"
                                            height="100%"
                                            frameBorder="0"
                                            scrolling="no"
                                            marginHeight={0}
                                            marginWidth={0}
                                            src={`https://maps.google.com/maps?q=${encodeURIComponent(localConfig.contactAddress || agent.office_address || `${agent.city}, ${agent.state}`)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                                            className="opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                                        />
                                    </div>
                                )}

                                {/* Contact Info Cards */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <a href={`mailto:${localConfig.contactEmail || agent.primary_email}`} className="group p-6 bg-[var(--bg-alt)] hover:bg-[var(--bg-main)] hover:shadow-md rounded-2xl border border-[var(--bg-alt)] transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-bold">Email</p>
                                                <p className="text-[var(--text-main)] font-medium truncate">{localConfig.contactEmail || agent.primary_email || '—'}</p>
                                            </div>
                                        </div>
                                    </a>

                                    <a href={`tel:${localConfig.contactPhone || agent.primary_phone}`} className="group p-6 bg-[var(--bg-alt)] hover:bg-[var(--bg-main)] hover:shadow-md rounded-2xl border border-[var(--bg-alt)] transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                                <Phone className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-bold">Phone</p>
                                                <p className="text-[var(--text-main)] font-medium">{localConfig.contactPhone || agent.primary_phone || '—'}</p>
                                            </div>
                                        </div>
                                    </a>

                                    {(agent.city && agent.city !== 'Unknown' && agent.state && agent.state !== 'XX') && (
                                        <div className="group p-6 bg-[var(--bg-alt)] hover:bg-[var(--bg-main)] hover:shadow-md rounded-2xl border border-[var(--bg-alt)] sm:col-span-2 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                                    <MapPin className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-bold">Office</p>
                                                    <p className="text-[var(--text-main)] font-medium">{localConfig.contactAddress || agent.office_address || `${agent.city}, ${agent.state}`}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>


                                {/* Social Links */}
                                <div className="flex gap-4 pt-4">
                                    {(localConfig.linkedinUrl || agent.linkedin_url) && (
                                        <a href={localConfig.linkedinUrl || agent.linkedin_url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white shadow-sm hover:shadow-md transition-all border border-slate-100">
                                            <Linkedin className="w-5 h-5" />
                                        </a>
                                    )}
                                    {(localConfig.facebookUrl || agent.facebook_url) && (
                                        <a href={localConfig.facebookUrl || agent.facebook_url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white shadow-sm hover:shadow-md transition-all border border-slate-100">
                                            <Facebook className="w-5 h-5" />
                                        </a>
                                    )}
                                    {(localConfig.instagramUrl || agent.instagram_url) && (
                                        <a href={localConfig.instagramUrl || agent.instagram_url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white shadow-sm hover:shadow-md transition-all border border-slate-100">
                                            <Instagram className="w-5 h-5" />
                                        </a>
                                    )}
                                    {(localConfig.twitterUrl || agent.twitter_url) && (
                                        <a href={localConfig.twitterUrl || agent.twitter_url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white shadow-sm hover:shadow-md transition-all border border-slate-100">
                                            <Twitter className="w-5 h-5" />
                                        </a>
                                    )}
                                    {(localConfig.youtubeUrl || agent.youtube_url) && (
                                        <a href={localConfig.youtubeUrl || agent.youtube_url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-primary hover:text-white shadow-sm hover:shadow-md transition-all border border-slate-100">
                                            <Youtube className="w-5 h-5" />
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ===== FOOTER ===== */}
                <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                            {/* Brand */}
                            <div className="space-y-3">
                                <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                                    {agent.full_name}
                                </h3>
                                {agent.license_number && (
                                    <p className="text-slate-500 text-sm font-medium border-l-2 border-primary pl-3">
                                        License #: {agent.license_number}
                                    </p>
                                )}
                                <p className="leading-relaxed text-sm">
                                    <EditableText
                                        value={localConfig.footerBio || (agent.bio ? agent.bio.slice(0, 100) + (agent.bio.length > 100 ? '...' : '') : 'Dedicated to exceptional real estate services.')}
                                        isEditing={isEditing}
                                        onChange={val => updateConfig('footerBio', val)}
                                        multiline
                                    />
                                </p>
                                <div className="flex gap-2 pt-1">
                                    {agent.linkedin_url && (
                                        <a href={agent.linkedin_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white hover:bg-primary transition-colors border border-slate-800">
                                            <Linkedin className="w-4 h-4" />
                                        </a>
                                    )}
                                    {agent.facebook_url && (
                                        <a href={agent.facebook_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white hover:bg-primary transition-colors border border-slate-800">
                                            <Facebook className="w-4 h-4" />
                                        </a>
                                    )}
                                    {agent.instagram_url && (
                                        <a href={agent.instagram_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white hover:bg-primary transition-colors border border-slate-800">
                                            <Instagram className="w-4 h-4" />
                                        </a>
                                    )}
                                    {agent.twitter_url && (
                                        <a href={agent.twitter_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white hover:bg-primary transition-colors border border-slate-800">
                                            <Twitter className="w-4 h-4" />
                                        </a>
                                    )}
                                    {agent.youtube_url && (
                                        <a href={agent.youtube_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white hover:bg-primary transition-colors border border-slate-800">
                                            <Youtube className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Navigation */}
                            <div>
                                <h4 className="text-white font-bold uppercase tracking-wider mb-6">
                                    <EditableText
                                        value={localConfig.footerExploreTitle || "Explore"}
                                        isEditing={isEditing}
                                        onChange={val => updateConfig('footerExploreTitle', val)}
                                    />
                                </h4>
                                <ul className="space-y-3">
                                    <li><a href="#hero" className="hover:text-primary transition-colors">Home</a></li>
                                    <li><a href="#about" className="hover:text-primary transition-colors">About</a></li>
                                    <li><a href="#services" className="hover:text-primary transition-colors">Services</a></li>
                                    <li><a href="#contact" className="hover:text-primary transition-colors">Contact</a></li>
                                </ul>
                            </div>

                            {/* Contact */}
                            <div>
                                <h4 className="text-white font-bold uppercase tracking-wider mb-6">
                                    <EditableText
                                        value={localConfig.footerVisitTitle || "Visit Us"}
                                        isEditing={isEditing}
                                        onChange={val => updateConfig('footerVisitTitle', val)}
                                    />
                                </h4>
                                <ul className="space-y-4">
                                    {(agent.city && agent.city !== 'Unknown' && agent.state && agent.state !== 'XX') && (
                                        <li className="flex items-start gap-3">
                                            <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                            <span>{agent.office_address || `${agent.city}, ${agent.state}`}</span>
                                        </li>
                                    )}
                                    <li className="flex items-center gap-3">
                                        <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                                        <a href={`tel:${agent.primary_phone}`} className="hover:text-primary transition-colors">{agent.primary_phone}</a>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                                        <a href={`mailto:${agent.primary_email}`} className="hover:text-primary transition-colors truncate">{agent.primary_email}</a>
                                    </li>
                                </ul>
                            </div>

                            {/* Branding Column */}
                            <div>
                                <h4 className="text-white font-semibold uppercase tracking-wider mb-4 text-sm">Brokerage</h4>
                                <div className="flex flex-row flex-nowrap items-center gap-4 mb-3">
                                    {(localConfig.logoUrl || agent.logo_url) && (
                                        <div className="bg-white p-3 rounded-lg flex-shrink-0">
                                            <img src={localConfig.logoUrl || agent.logo_url} alt={agent.full_name} className="h-14 object-contain" />
                                        </div>
                                    )}
                                    {agent.brokerage_logo_url && (
                                        <div className="bg-white p-3 rounded-lg flex-shrink-0">
                                            <img src={agent.brokerage_logo_url} alt={agent.brokerage} className="h-14 object-contain" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Bar: Compliance + Copyright */}
                        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <img src="/assets/Fair-Housing-Logo-PNG-Images-HD.png" alt="Equal Housing Opportunity" className="h-12 opacity-80" />
                            </div>
                            <div className="flex flex-col items-center md:items-end gap-2">
                                <p className="text-xs text-slate-600">&copy; {new Date().getFullYear()} {agent.full_name}. All rights reserved.</p>
                                <a href="/" className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400 transition-colors">
                                    <span>Made by</span>
                                    <span className="font-bold text-slate-400">Site<span style={{ color: '#6366F1' }}>o</span></span>
                                </a>
                            </div>
                        </div>
                    </div>
                </footer>

                {/* Service Modal */}
                <ServiceModal
                    isOpen={activeModal !== null}
                    onClose={() => setActiveModal(null)}
                    serviceType={activeModal || 'selling'}
                    agentId={agent.id}
                    agentName={agent.full_name}
                />

                {/* Booking Modal */}
                <BookingModal
                    isOpen={bookingOpen}
                    onClose={() => setBookingOpen(false)}
                    agentId={agent.id}
                    agentName={agent.full_name}
                />

                {/* Claim Banner - Only show if not paid and not editing */}
                {/* Claim Banner Removed */}
            </div>
        </GoogleReCaptchaProvider>
    )
}
