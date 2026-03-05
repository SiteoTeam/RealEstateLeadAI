import { useEffect, useRef, useState, useMemo } from 'react'
import { motion, useScroll, useTransform, useMotionValueEvent, useSpring, useMotionValue, MotionValue } from 'framer-motion'
import { Link } from 'react-router-dom'

/* ═══════════════════════════════════════════════════════════════
   SITEO LANDING V2 — Cinematic Storytelling Experience
   A 1000vh continuous scroll journey from invisible to obvious choice.
   Using Framer Motion for high-performance parallax and fades.
   ═══════════════════════════════════════════════════════════════ */

/* ─────────────── Mouse Position Hook ─────────────── */
function useMousePosition() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

    useEffect(() => {
        const updateMousePosition = (ev: MouseEvent) => {
            setMousePosition({
                x: (ev.clientX / window.innerWidth - 0.5) * 2,
                y: (ev.clientY / window.innerHeight - 0.5) * 2
            })
        }
        window.addEventListener('mousemove', updateMousePosition)
        return () => window.removeEventListener('mousemove', updateMousePosition)
    }, [])

    return mousePosition
}

/* ─────────────── Typewriter Hook ─────────────── */
function useTypewriter(text: string, trigger: boolean, speed = 40) {
    const [display, setDisplay] = useState('')

    useEffect(() => {
        if (!trigger) { setDisplay(''); return }
        let i = 0
        setDisplay('')
        const interval = setInterval(() => {
            i++
            setDisplay(text.slice(0, i))
            if (i >= text.length) clearInterval(interval)
        }, speed)
        return () => clearInterval(interval)
    }, [trigger, text, speed])

    return display
}

/* ─────────────── Physics + Galaxy Collapse ─────────────── */
function InternetGalaxy({ scrollProgress, mouseX, mouseY }: { scrollProgress: number, mouseX: number, mouseY: number }) {
    const mvX = useMotionValue(0)
    const mvY = useMotionValue(0)

    useEffect(() => {
        mvX.set(mouseX)
        mvY.set(mouseY)
    }, [mouseX, mouseY, mvX, mvY])

    const smoothX = useSpring(mvX, { stiffness: 40, damping: 30 })
    const smoothY = useSpring(mvY, { stiffness: 40, damping: 30 })

    // Base Parallax Layers
    const l1x = useTransform(smoothX, [-1, 1], [-20, 20])
    const l1y = useTransform(smoothY, [-1, 1], [-20, 20])
    const l2x = useTransform(smoothX, [-1, 1], [-50, 50])
    const l2y = useTransform(smoothY, [-1, 1], [-50, 50])

    const stars = useMemo(() => Array.from({ length: 150 }, (_, i) => ({
        id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 2 + 1, opacity: Math.random() * 0.3 + 0.1,
        z: Math.random() * -500 - 200 // True depth
    })), [])

    const cards = useMemo(() => Array.from({ length: 60 }, (_, i) => {
        const isFg = i < 15;
        return {
            id: i,
            x: Math.random() * 120 - 10,
            y: Math.random() * 120 - 10,
            size: isFg ? Math.random() * 80 + 60 : Math.random() * 30 + 20,
            rotation: Math.random() * 60 - 30,
            opacity: isFg ? Math.random() * 0.4 + 0.1 : Math.random() * 0.2 + 0.05,
            z: isFg ? Math.random() * 400 + 100 : Math.random() * -300 - 100, // Z-depth distribution
            isFg
        }
    }), [])

    // Collapse Progress (Scroll 0.0 -> 0.15)
    // 0 = Normal galaxy. 1 = Everything sucked into the exact center of screen.
    const collapseP = Math.min(1, Math.max(0, scrollProgress * 6.66))

    // Gravity field (cursor attraction) strength based on collapse (turns off during collapse)
    const gravityActive = collapseP < 0.1

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}>
            {/* Stars Layer */}
            <motion.div className="absolute inset-0"
                style={{
                    x: l1x, y: l1y,
                    opacity: 1 - collapseP * 2,
                    transformStyle: 'preserve-3d'
                }}>
                {stars.map(s => {
                    // Spiral logic for collapse
                    const dx = 50 - s.x;
                    const dy = 50 - s.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx) + collapseP * 5; // Spin as it collapses
                    const currentDist = dist * (1 - Math.pow(collapseP, 2));

                    const finalX = 50 - Math.cos(angle) * currentDist;
                    const finalY = 50 - Math.sin(angle) * currentDist;

                    // Energy Lens: subtle star distortion near cursor
                    const mPx = (mouseX + 1) * 50;
                    const mPy = (mouseY + 1) * 50;
                    let lensX = finalX;
                    let lensY = finalY;

                    if (gravityActive) {
                        const mdx = mPx - s.x;
                        const mdy = mPy - s.y;
                        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
                        if (mDist < 15) {
                            const pull = (15 - mDist) * 0.05;
                            lensX += (mdx / mDist) * pull;
                            lensY += (mdy / mDist) * pull;
                        }
                    }

                    return (
                        <div key={s.id} className="absolute rounded-full bg-indigo-400"
                            style={{
                                left: `${lensX}%`, top: `${lensY}%`, width: s.size, height: s.size, opacity: s.opacity,
                                transform: `translateZ(${s.z}px)`,
                                boxShadow: `0 0 ${s.size * 2}px rgba(129,140,248,0.5)`
                            }} />
                    )
                })}
            </motion.div>

            {/* Cards Layer (Mid + Foreground combined for proper Z-sorting) */}
            <motion.div className="absolute inset-0"
                style={{
                    x: l2x, y: l2y,
                    transformStyle: 'preserve-3d'
                }}>
                {cards.map(c => {
                    // Collapse Physics
                    const dx = 50 - c.x;
                    const dy = 50 - c.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx) + collapseP * 4;
                    const currentDist = dist * (1 - Math.pow(collapseP, 3)); // Snap to center fast at the end

                    const finalX = 50 - Math.cos(angle) * currentDist;
                    const finalY = 50 - Math.sin(angle) * currentDist;

                    // Energy Lens / Gravity Cursor Physics
                    const mPx = (mouseX + 1) * 50;
                    const mPy = (mouseY + 1) * 50;
                    let gravX = finalX;
                    let gravY = finalY;
                    let energyGlow = 0;

                    if (gravityActive) {
                        const mdx = mPx - c.x;
                        const mdy = mPy - c.y;
                        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);

                        // If within 25% viewport distance
                        if (mDist < 25) {
                            // Attract slightly towards cursor
                            const pull = (25 - mDist) * (c.isFg ? 0.3 : 0.15); // Foreground pulled more
                            gravX += (mdx / mDist) * pull;
                            gravY += (mdy / mDist) * pull;

                            // Increase intensity (0 to 1) based on proximity
                            energyGlow = (25 - mDist) / 25;
                        }
                    }

                    // Push Z toward 0 during collapse to form a flat lonely website
                    const currentZ = c.z * (1 - collapseP);
                    const currentRot = c.rotation * (1 - collapseP);
                    const currentScale = 1 - (collapseP * (c.isFg ? 0.9 : 0.5)); // Shrink heavily as it collapses

                    const activeBgColor = c.isFg ? `rgba(15,23,42,${0.6 + energyGlow * 0.3})` : `rgba(15,23,42,${0.4 + energyGlow * 0.2})`;
                    const activeBorderColor = `rgba(99,102,241,${c.isFg ? 0.3 + energyGlow * 0.5 : 0.2 + energyGlow * 0.3})`;
                    const activeBoxShadow = energyGlow > 0 ? `0 0 ${20 + energyGlow * 40}px rgba(129,140,248,${energyGlow * 0.5})` : (c.isFg ? '0 25px 50px -12px rgba(0,0,0,0.5)' : 'none');

                    return (
                        <div key={c.id} className={`absolute rounded-md border backdrop-blur-md transition-all duration-700`}
                            style={{
                                background: activeBgColor,
                                borderColor: activeBorderColor,
                                boxShadow: activeBoxShadow,
                                left: `${gravX}%`, top: `${gravY}%`, width: c.size, height: c.size * 0.7,
                                transform: `translate(-50%, -50%) translateZ(${currentZ}px) rotate(${currentRot}deg) scale(${currentScale})`,
                                opacity: collapseP > 0.8 ? 0 : c.opacity + energyGlow * 0.3,
                                filter: c.z < -100 ? `blur(${Math.min(4, Math.abs(c.z) / 100)}px)` : 'none',
                                willChange: 'transform, left, top'
                            }}>
                            {c.isFg && (
                                <div className="p-2 space-y-1.5 opacity-50" style={{ transition: 'opacity 0.5s', opacity: 0.5 + energyGlow * 0.5 }}>
                                    <div className="h-1.5 w-3/4 rounded-full bg-indigo-500/40" style={{ background: `rgba(99,102,241,${0.4 + energyGlow * 0.4})` }} />
                                    <div className="h-1 w-1/2 rounded-full bg-indigo-500/20" style={{ background: `rgba(99,102,241,${0.2 + energyGlow * 0.4})` }} />
                                    <div className="h-1 w-2/3 rounded-full bg-indigo-500/20" style={{ background: `rgba(99,102,241,${0.2 + energyGlow * 0.4})` }} />
                                </div>
                            )}
                        </div>
                    )
                })}
            </motion.div>
        </div>
    )
}

/* ─────────────── Lonely Website Mockup (with Time) ─────────────── */
function LonelyWebsite({ active, timeProgress }: { active: boolean, timeProgress: MotionValue<number> }) {
    const [day, setDay] = useState(1)

    useMotionValueEvent(timeProgress, "change", (latest) => {
        setDay(Math.min(30, Math.max(1, Math.floor(latest * 30))))
    })

    return (
        <div className="relative w-full max-w-[400px] mx-auto transition-all duration-[2s]"
            style={{
                opacity: active ? 1 : 0,
                transform: active ? 'perspective(1000px) scale(1) translateY(0) rotateX(0deg)' : 'perspective(1000px) scale(0.8) translateY(40px) rotateX(10deg)'
            }}>
            {/* UI Glow halo */}
            <div className="absolute inset-0 rounded-2xl blur-3xl transition-all duration-1000 opacity-20"
                style={{ background: 'radial-gradient(circle, #334155, transparent)' }} />

            <div className="relative rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-slate-900/50">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/50">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                    </div>
                    <div className="flex-1 mx-3 bg-slate-700/50 rounded px-3 py-1 text-[10px] text-slate-500 text-center font-mono">
                        mybusiness.com
                    </div>
                </div>
                <div className="p-8 space-y-6 min-h-[240px] flex flex-col items-center justify-center relative">
                    {/* Empty Analytics Graph */}
                    <div className="w-full h-24 border-b border-l border-slate-700/50 relative flex items-end">
                        <svg className="w-full h-full text-slate-800" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <path d="M0,90 L20,95 L40,90 L60,95 L80,90 L100,95" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                        </svg>
                        <div className="absolute top-2 left-2 text-[9px] text-slate-600 font-mono uppercase tracking-widest">Traffic</div>
                    </div>

                    {/* Time passing UI */}
                    <div className="flex items-center gap-4 text-slate-500 font-mono">
                        <div className="flex flex-col items-center">
                            <span className="text-xs uppercase tracking-wider text-slate-600">Day</span>
                            <span className="text-2xl font-bold text-slate-400">{day}</span>
                        </div>
                        <div className="w-px h-8 bg-slate-700/50" />
                        <div className="flex flex-col items-center">
                            <span className="text-xs uppercase tracking-wider text-slate-600">Visitors</span>
                            <span className="text-2xl font-bold text-slate-500">0</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ─────────────── Active System Mockup ─────────────── */
function ActiveSystem({ active }: { active: boolean }) {
    const [notifications, setNotifications] = useState<string[]>([])

    useEffect(() => {
        if (!active) { setNotifications([]); return }
        const msgs = ['New visitor', 'Form submitted', 'Lead captured', 'Meeting booked', 'New visitor', 'Email sent']
        let i = 0
        const interval = setInterval(() => {
            if (i < msgs.length) {
                setNotifications(prev => [...prev.slice(-3), msgs[i]])
                i++
            }
        }, 600)
        return () => clearInterval(interval)
    }, [active])

    return (
        <div className="relative w-full max-w-[400px] mx-auto transition-all duration-[2s]"
            style={{
                opacity: active ? 1 : 0,
                transform: active ? 'perspective(1000px) scale(1) translateY(0) rotateX(0deg)' : 'perspective(1000px) scale(0.8) translateY(40px) rotateX(-10deg)'
            }}>
            {/* Dynamic Halo */}
            <div className={`absolute inset-0 rounded-2xl blur-[40px] transition-all duration-1000 ${active ? 'opacity-40 animate-pulse' : 'opacity-0'}`}
                style={{ background: 'radial-gradient(circle, #6366f1, #a855f7)' }} />

            <div className="relative rounded-2xl overflow-hidden border border-indigo-500/30 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-indigo-500/20">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 border-b border-indigo-500/20">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="flex-1 mx-3 bg-indigo-950/50 border border-indigo-500/20 rounded px-3 py-1 text-[10px] text-indigo-300 text-center font-mono shadow-inner">
                        <span className="w-1.5 h-1.5 inline-block rounded-full bg-emerald-400 animate-pulse mr-1.5 shadow-[0_0_8px_#34d399]" />
                        mybusiness.siteo.io
                    </div>
                </div>
                <div className="p-6 space-y-4 min-h-[240px] relative overflow-hidden">
                    {/* Glowing graph base */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-indigo-500/10 to-transparent pointer-events-none" />

                    <div className="h-3 w-2/3 bg-indigo-500/30 rounded shadow-[0_0_10px_rgba(99,102,241,0.3)]" />
                    <div className="h-2 w-full bg-indigo-500/20 rounded" />
                    <div className="h-2 w-3/4 bg-indigo-500/15 rounded" />

                    {/* Live notifications */}
                    <div className="absolute top-4 right-4 space-y-2">
                        {notifications.map((msg, i) => (
                            <div key={`${msg}-${i}`} className="flex items-center gap-2 bg-slate-900/90 border border-emerald-500/30 text-emerald-100 text-[10px] font-bold px-3 py-1.5 rounded-md shadow-lg backdrop-blur-sm"
                                style={{ animation: 'notifPopRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399]" />
                                {msg}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ─────────────── Machine Component ─────────────── */
function MachineComponent({ label, active, direction, delay, accent }: { label: string; active: boolean; direction: 'left' | 'right' | 'up' | 'down', delay: number, accent: string }) {
    const getTransform = () => {
        if (active) return 'translate(0, 0) scale(1)'
        switch (direction) {
            case 'left': return 'translate(-80px, 0) scale(0.8)'
            case 'right': return 'translate(80px, 0) scale(0.8)'
            case 'up': return 'translate(0, 80px) scale(0.8)'
            case 'down': return 'translate(0, -80px) scale(0.8)'
        }
    }

    return (
        <div className="relative"
            style={{
                opacity: active ? 1 : 0,
                transform: getTransform(),
                transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transitionDelay: `${delay}ms`
            }}>
            {/* Glow halo */}
            <div className={`absolute inset-0 blur-xl transition-opacity duration-1000 ${active ? 'opacity-40' : 'opacity-0'}`}
                style={{ background: accent, transitionDelay: `${delay + 400}ms` }} />

            <div className="relative px-6 py-4 rounded-xl border bg-slate-900/80 backdrop-blur-md text-center z-10"
                style={{
                    borderColor: active ? `${accent}60` : `${accent}20`,
                    boxShadow: active ? `inset 0 0 20px ${accent}20, 0 5px 15px rgba(0,0,0,0.5)` : 'none',
                }}>
                <span className="text-sm font-black tracking-wide" style={{ color: active ? accent : `${accent}80` }}>{label}</span>
            </div>

            {/* Circuit dot */}
            <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full transition-all duration-300 ${active ? 'scale-100' : 'scale-0'}`}
                style={{
                    background: accent,
                    boxShadow: `0 0 10px ${accent}, 0 0 20px ${accent}`,
                    transitionDelay: `${delay + 600}ms`
                }} />
        </div>
    )
}

/* ─────────────── Notification Stack ─────────────── */
function NotificationStack({ active }: { active: boolean }) {
    const [items, setItems] = useState<{ text: string; id: number }[]>([])

    useEffect(() => {
        if (!active) { setItems([]); return }
        const msgs = [
            'New lead captured', 'New booking', 'New client', 'Form submitted',
            'New lead captured', 'Meeting scheduled', 'New lead captured', 'New booking',
            'Proposal sent', 'New lead captured', 'New client', 'Meeting booked',
        ]
        let i = 0
        let speed = 800
        const addItem = () => {
            if (i < msgs.length) {
                setItems(prev => [...prev.slice(-5), { text: msgs[i], id: Date.now() + i }])
                i++
                speed = Math.max(150, speed * 0.75) // accelerate
                setTimeout(addItem, speed)
            }
        }
        const timeout = setTimeout(addItem, 300)
        return () => clearTimeout(timeout)
    }, [active])

    return (
        <div className="flex flex-col items-center gap-2 min-h-[200px]">
            {items.map(item => (
                <div key={item.id} className="flex items-center gap-2 bg-slate-800/60 border border-indigo-500/20 backdrop-blur-sm text-white text-xs font-medium px-4 py-2 rounded-full"
                    style={{ animation: 'notifSlide 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    {item.text}
                </div>
            ))}
        </div>
    )
}

/* ─────────────── Cinematic Lead Particles (With Collapse) ─────────────── */
function CinematicLeads({ active, intensityProgress }: { active: boolean; intensityProgress: MotionValue<number> }) {
    const [intensity, setIntensity] = useState(0)

    useMotionValueEvent(intensityProgress, "change", (latest) => {
        setIntensity(latest)
    })

    const particles = useMemo(() => Array.from({ length: 150 }, (_, i) => ({
        id: i,
        angle: Math.random() * Math.PI * 2,
        distance: Math.random() * 60 + 20,
        speed: (Math.random() * 0.5 + 0.5),
        size: Math.random() * 4 + 1,
        delay: Math.random() * 2
    })), [])

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center perspective-[1000px]">
            {active && particles.map(p => {
                // Phase 1 (0 to 0.4): slow orbit
                // Phase 2 (0.4 to 0.8): chaotic swirl
                // Phase 3 (0.8 to 1.0): collapse to center

                let currentDist = p.distance;
                let rotateSpeed = p.speed;
                let zPos = 0;

                if (intensity > 0.4 && intensity <= 0.8) {
                    // Swirl tighter and faster
                    const swirlProgress = (intensity - 0.4) / 0.4;
                    currentDist = p.distance * (1 - swirlProgress * 0.5);
                    rotateSpeed = p.speed * (1 + swirlProgress * 5);
                    zPos = Math.sin(p.angle * 5) * swirlProgress * 200;
                } else if (intensity > 0.8) {
                    // Collapse into center
                    const collapseProgress = (intensity - 0.8) / 0.2;
                    currentDist = p.distance * 0.5 * (1 - Math.pow(collapseProgress, 4));
                    rotateSpeed = p.speed * 6;
                    zPos = 0; // Flatten out to hit the number
                }

                // Initial position calculate for CSS transform Origin spinning
                const startX = Math.cos(p.angle) * currentDist;
                const startY = Math.sin(p.angle) * currentDist;

                // Opacity fades out when fully collapsed
                const opacity = intensity > 0.95 ? 1 - ((intensity - 0.95) / 0.05) : (intensity > 0.8 ? 1 : 0.6);

                return (
                    <div key={p.id} className="absolute rounded-full"
                        style={{
                            width: p.size,
                            height: p.size,
                            background: intensity > 0.7 ? '#fff' : '#c084fc',
                            boxShadow: `0 0 ${p.size * 3}px ${intensity > 0.7 ? '#fff' : '#c084fc'}`,
                            animation: `spiralIn ${rotateSpeed}s linear ${p.delay}s infinite`,
                            transformOrigin: `${-startX}vw ${-startY}vh`,
                            ['--startX' as string]: `${startX}vw`,
                            ['--startY' as string]: `${startY}vh`,
                            transform: `translateZ(${zPos}px)`,
                            opacity
                        }} />
                )
            })}
        </div>
    )
}

/* ─────────────── Advanced City Map ─────────────── */
function AdvancedCityMap({ active, highlightProgress }: { active: boolean; highlightProgress: MotionValue<number> }) {
    const [progress, setProgress] = useState(0)

    useMotionValueEvent(highlightProgress, "change", (latest) => {
        setProgress(latest)
    })

    const nodes = useMemo(() => Array.from({ length: 45 }, (_, i) => ({
        id: i,
        x: 5 + Math.random() * 90,
        y: 5 + Math.random() * 90,
        isMain: i === 22,
    })), [])

    const mainNode = nodes.find(n => n.isMain)!

    return (
        <div className="relative w-full max-w-[800px] mx-auto aspect-[21/9] rounded-3xl overflow-hidden border border-slate-800/50 bg-[#020408] shadow-2xl">
            {/* Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-30" style={{
                backgroundImage: `linear-gradient(rgba(129,140,248,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(129,140,248,0.1) 1px, transparent 1px)`,
                backgroundSize: '30px 30px',
                transform: `scale(${1 + progress * 0.1})`,
                transition: 'transform 0.5s ease-out'
            }} />

            {/* Glowing lines towards main node */}
            {active && progress > 0 && nodes.filter(n => !n.isMain).slice(0, 15).map((n, i) => {
                // To curve the paths, we use a bezier curve
                const cx = (n.x + mainNode.x) / 2 + (Math.random() * 20 - 10);
                const cy = (n.y + mainNode.y) / 2 + (Math.random() * 20 - 10);
                const pathData = `M ${n.x} ${n.y} Q ${cx} ${cy} ${mainNode.x} ${mainNode.y}`;

                return (
                    <svg key={`line-${i}`} className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                        {/* Base dim line */}
                        <path d={pathData} fill="none" stroke="rgba(129,140,248,0.1)" strokeWidth="0.2" />

                        {/* Animated traveling lead streak (only shows as progress nears 1) */}
                        {progress > 0.3 && (
                            <path
                                d={pathData}
                                fill="none"
                                stroke="url(#grad)"
                                strokeWidth="0.5"
                                strokeDasharray="5 100"
                                className="opacity-80"
                                style={{
                                    animation: `travelPath ${1.5 + Math.random()}s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
                                    animationDelay: `${Math.random()}s`
                                }}
                            />
                        )}
                        <defs>
                            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="50%" stopColor="#c084fc" />
                                <stop offset="100%" stopColor="#fff" />
                            </linearGradient>
                        </defs>
                    </svg>
                )
            })}

            {/* Nodes */}
            {nodes.map(n => {
                const isWinner = n.isMain;
                // Competitors dim as we highlight
                const competitorOpacity = Math.max(0.05, 0.4 - progress * 0.5);

                return (
                    <div key={n.id} className="absolute transition-all duration-1000"
                        style={{ left: `${n.x}%`, top: `${n.y}%`, transform: 'translate(-50%, -50%)' }}>
                        <div className="rounded-sm transition-all duration-700 font-mono text-[6px] text-center"
                            style={{
                                width: isWinner && progress > 0.5 ? 40 : 8,
                                height: isWinner && progress > 0.5 ? 40 : 8,
                                background: isWinner && progress > 0.5
                                    ? '#4f46e5'
                                    : `rgba(100,116,139,${isWinner ? 0.3 : competitorOpacity})`,
                                boxShadow: isWinner && progress > 0.5
                                    ? '0 0 30px #4f46e5, 0 0 60px #818cf8, inset 0 0 10px #fff'
                                    : 'none',
                                borderRadius: isWinner && progress > 0.5 ? '50%' : '2px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                            {isWinner && progress > 0.8 && <span className="text-white font-bold text-xs animate-fadeIn">YOU</span>}
                        </div>
                        {isWinner && progress > 0.5 && (
                            <>
                                <div className="absolute inset-0 rounded-full border border-indigo-400/50" style={{ animation: 'pulseRing 1.5s ease-out infinite' }} />
                                <div className="absolute inset-0 rounded-full border border-indigo-400/30" style={{ animation: 'pulseRing 1.5s ease-out 0.75s infinite' }} />
                            </>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

/* ─────────────── Convergence Final CTA ─────────────── */
function ConvergenceCTA({ active, convergenceProgress }: { active: boolean; convergenceProgress: MotionValue<number> }) {
    const [progress, setProgress] = useState(0)

    useMotionValueEvent(convergenceProgress, "change", (latest) => {
        setProgress(latest)
    })

    // Generate convergence particles
    const sparks = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
        id: i,
        angle: Math.random() * Math.PI * 2,
        dist: Math.random() * 80 + 20,
    })), [])

    return (
        <div className="relative z-10 text-center max-w-3xl px-6 flex flex-col items-center">
            {/* Particles converging into button */}
            {active && progress < 0.99 && sparks.map(s => {
                // Exponential easing for convergence collapse
                const easeOutQuad = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                const easeInExp = progress === 0 ? 0 : Math.pow(2, 10 * progress - 10);

                // Switch from slow gathering to rapid snap
                const collapseForce = progress < 0.6 ? easeOutQuad : easeInExp;

                const px = Math.cos(s.angle) * s.dist * (1 - collapseForce);
                const py = Math.sin(s.angle) * s.dist * (1 - collapseForce);
                // When progress reaches 1, they are perfectly at 0,0 (center of screen)
                return (
                    <div key={s.id} className="absolute w-2 h-2 rounded-full bg-indigo-300 blur-[1px] pointer-events-none"
                        style={{
                            left: `calc(50% + ${px}vw)`,
                            top: `calc(50% + ${py}vh)`,
                            opacity: progress < 0.1 ? 0 : (1 - Math.pow(progress, 8)), // Snaps off right at the end
                            boxShadow: '0 0 10px #c084fc'
                        }} />
                )
            })}

            <h2 className="text-5xl md:text-7xl font-black tracking-tight mb-6 transition-all duration-[1.5s]"
                style={{
                    opacity: progress > 0.5 ? 1 : 0,
                    transform: progress > 0.5 ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)'
                }}>
                Your business wasn't meant to be{' '}
                <span className="relative inline-block">
                    <span className="absolute inset-0 blur-xl opacity-50 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mix-blend-screen" />
                    <span style={{ background: 'linear-gradient(135deg, #818cf8, #f472b6, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', position: 'relative' }}>
                        invisible.
                    </span>
                </span>
            </h2>
            <p className="text-slate-400 text-xl md:text-2xl mb-16 font-light transition-all duration-1000 delay-300"
                style={{ opacity: progress > 0.6 ? 1 : 0 }}>
                Live in three days.
            </p>

            <div className="transition-all duration-1000 delay-500 relative"
                style={{ opacity: progress > 0.7 ? 1 : 0, transform: progress > 0.7 ? 'scale(1)' : 'scale(0.8)' }}>
                {/* Master Button Glow */}
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-[30px] opacity-40 animate-pulse" />
                <button
                    className="relative block w-full group overflow-hidden"
                    onClick={() => document.getElementById('intake-modal')?.classList.remove('hidden')}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur" />
                    <div className="relative px-16 py-6 bg-[#0a0f1e] ring-1 ring-white/10 rounded-3xl flex items-center justify-center transition-all duration-500 group-hover:bg-[#111827] group-hover:ring-indigo-500/50">
                        {/* Shimmer sweep */}
                        <div className="absolute inset-0 pointer-events-none" style={{
                            background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 35%, transparent 40%)',
                            backgroundSize: '200% auto',
                            animation: 'shimmerSweep 3s cubic-bezier(0.16, 1, 0.3, 1) infinite'
                        }} />
                        <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent group-hover:to-white transition-all">
                            Build My Client System
                        </span>
                    </div>
                </button>
            </div>
        </div>
    )
}

/* ─────────────── App Root ─────────────── */
export function LandingPageV2() {
    const containerRef = useRef<HTMLDivElement>(null)
    const [scrollVal, setScrollVal] = useState(0)
    const mousePos = useMousePosition()

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    })

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        setScrollVal(latest)
    })

    const useFade = (inStart: number, inEnd: number, outStart: number, outEnd: number) =>
        useTransform(scrollYProgress, [inStart, inEnd, outStart, outEnd], [0, 1, 1, 0])

    // 1. Internet Galaxy [0.0 - 0.12]
    const s1Opacity = useTransform(scrollYProgress, [0, 0.08, 0.12, 0.14], [1, 1, 1, 0])
    const s1T1 = scrollVal > 0.02 && scrollVal < 0.13
    const s1T2 = scrollVal > 0.05 && scrollVal < 0.13

    // 2. The Lonely Business [0.12 - 0.24]
    const s2Opacity = useFade(0.12, 0.15, 0.22, 0.25)
    // Map scroll strictly within this scene to time passing [0, 1]
    const s2TimeProgress = useTransform(scrollYProgress, [0.15, 0.21], [0, 1])
    const s2T1 = scrollVal > 0.14 && scrollVal < 0.24
    const s2T2 = scrollVal > 0.16 && scrollVal < 0.24
    const s2T3 = scrollVal > 0.18 && scrollVal < 0.24

    // 3. Dead vs Living [0.24 - 0.36]
    const s3Opacity = useFade(0.24, 0.27, 0.35, 0.37)
    const s3LeftX = useTransform(scrollYProgress, [0.24, 0.27, 0.35, 0.37], [-100, 0, 0, -100])
    const s3RightX = useTransform(scrollYProgress, [0.24, 0.27, 0.35, 0.37], [100, 0, 0, 100])
    const s3Morph = scrollVal > 0.30

    // 4. System Assembles [0.36 - 0.48]
    const s4Opacity = useFade(0.36, 0.39, 0.46, 0.48)
    const s4DrawProgress = useTransform(scrollYProgress, [0.42, 0.46], [0, 1])

    // 5. Leads Flowing Chaos [0.48 - 0.60]
    const s5Opacity = useFade(0.48, 0.51, 0.58, 0.60)
    const s5Intensity = useTransform(scrollYProgress, [0.48, 0.56], [0, 1])
    const s5ShowNumber = scrollVal > 0.55

    // 6. Obvious Choice Grid [0.60 - 0.72]
    const s6Opacity = useFade(0.60, 0.63, 0.70, 0.72)
    const s6Highlight = useTransform(scrollYProgress, [0.64, 0.69], [0, 1])

    // 7. Time Advantage [0.72 - 0.84]
    const s7Opacity = useFade(0.72, 0.75, 0.82, 0.84)
    const s7BarLeft = useTransform(scrollYProgress, [0.76, 0.82], [0, 100])
    const s7BarRight = useTransform(scrollYProgress, [0.76, 0.78], [0, 100])
    const s7BarLeftWidth = useTransform(s7BarLeft, v => `${v}%`)
    const s7BarRightWidth = useTransform(s7BarRight, v => `${v}%`)

    // 8. The Future Network Ecosystem + Convergence [0.84 - 1.0]
    const s8Opacity = useTransform(scrollYProgress, [0.84, 0.87, 0.94], [0, 1, 0])
    const s8T1 = scrollVal > 0.86 && scrollVal < 0.94
    const s8T2 = scrollVal > 0.88 && scrollVal < 0.94
    const s8RotateX = useTransform(scrollYProgress, [0.84, 0.94], [40, 0])
    const s8Scale = useTransform(scrollYProgress, [0.84, 0.94], [2, 1])

    const s9Opacity = useTransform(scrollYProgress, [0.92, 0.95, 1], [0, 1, 1])
    const s9Convergence = useTransform(scrollYProgress, [0.93, 0.98], [0, 1])

    const t_s1_1 = useTypewriter('The internet is full of websites.', s1T1)
    const t_s1_2 = useTypewriter('Most of them are invisible.', s1T2)
    const t_s2_1 = useTypewriter('You built a website.', s2T1)
    const t_s2_2 = useTypewriter('And waited.', s2T2)
    const t_s2_3 = useTypewriter('But nothing happened.', s2T3)

    return (
        <div ref={containerRef} className="bg-[#03060d] text-white w-full h-[1400vh] relative selection:bg-indigo-500/30" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* Global Fixed Viewport with Subtle Camera Drift */}
            <motion.div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center transform-gpu"
                style={{
                    rotateX: useTransform(useSpring(mousePos.y, { stiffness: 40, damping: 30 }), [-1, 1], [3, -3]),
                    rotateY: useTransform(useSpring(mousePos.x, { stiffness: 40, damping: 30 }), [-1, 1], [-3, 3]),
                    perspective: '2000px'
                }}>

                {/* Base cinematic vignette */}
                <div className="absolute inset-0 pointer-events-none z-50 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]" />

                {/* ══ SCENE 1 — Internet Galaxy ══ */}
                <motion.div style={{ opacity: s1Opacity }} className="absolute inset-0">
                    <InternetGalaxy scrollProgress={scrollVal} mouseX={mousePos.x} mouseY={mousePos.y} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center relative z-20 pointer-events-none">
                        <div className="text-center max-w-4xl px-6">
                            <p className="text-3xl md:text-5xl font-light text-slate-200 leading-relaxed min-h-[3em] drop-shadow-2xl">{t_s1_1}</p>
                            <p className="text-3xl md:text-5xl font-light text-slate-500 leading-relaxed mt-8 min-h-[3em]">{t_s1_2}</p>
                        </div>
                    </div>
                </motion.div>

                {/* ══ SCENE 2 — The Lonely Business & Time ══ */}
                <motion.div style={{ opacity: s2Opacity }} className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-full max-w-lg px-6">
                        <LonelyWebsite active={scrollVal > 0.12 && scrollVal < 0.26} timeProgress={s2TimeProgress} />
                    </div>
                    <div className="mt-16 text-center space-y-5 px-6 h-[140px] z-10">
                        <p className="text-2xl md:text-4xl font-light text-slate-400 min-h-[1.5em]">{t_s2_1}</p>
                        <p className="text-2xl md:text-4xl font-light text-slate-500 min-h-[1.5em]">{t_s2_2}</p>
                        <p className="text-2xl md:text-4xl font-light text-slate-600 min-h-[1.5em]">{t_s2_3}</p>
                    </div>
                </motion.div>

                {/* ══ SCENE 3 — Dead vs Living ══ */}
                <motion.div style={{ opacity: s3Opacity }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                        <motion.div style={{ x: s3LeftX }}>
                            <LonelyWebsite active={scrollVal > 0.24 && scrollVal < 0.38} timeProgress={useMotionValue(0)} />
                            <p className="text-center mt-16 text-xl font-light transition-colors duration-1000" style={{ color: s3Morph ? '#334155' : '#94a3b8' }}>
                                {s3Morph ? 'Websites wait.' : 'Your website'}
                            </p>
                        </motion.div>
                        <motion.div style={{ x: s3RightX }}>
                            <ActiveSystem active={scrollVal > 0.24 && scrollVal < 0.38} />
                            <p className="text-center mt-16 text-xl font-bold transition-colors duration-1000" style={{ color: s3Morph ? '#a855f7' : '#475569' }}>
                                {s3Morph ? 'Systems work.' : 'Your system'}
                            </p>
                        </motion.div>
                    </div>
                </motion.div>

                {/* ══ SCENE 4 — Machine Assembly ══ */}
                <motion.div style={{ opacity: s4Opacity }} className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-20 relative z-10 text-center drop-shadow-2xl">
                        Your client acquisition{' '}
                        <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            engine.
                        </span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-6 max-w-6xl w-full relative z-10 items-center justify-center">
                        <MachineComponent label="Landing Page" direction="left" delay={0} active={scrollVal > 0.38} accent="#818cf8" />
                        <MachineComponent label="Lead Capture" direction="up" delay={200} active={scrollVal > 0.39} accent="#a78bfa" />
                        <MachineComponent label="Auto Booking" direction="down" delay={400} active={scrollVal > 0.40} accent="#c084fc" />
                        <MachineComponent label="Client Pipeline" direction="right" delay={600} active={scrollVal > 0.41} accent="#f472b6" />
                    </div>
                    {/* Glowing Circuit paths */}
                    <div className="relative z-10 mt-12 w-full max-w-4xl px-6 h-10">
                        {/* Base dim wire */}
                        <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-slate-800 -translate-y-1/2 rounded-full" />
                        {/* Active bright wire filling up */}
                        <motion.div className="absolute top-1/2 left-6 h-0.5 -translate-y-1/2 rounded-full origin-left"
                            style={{
                                right: '1.5rem',
                                scaleX: s4DrawProgress,
                                background: 'linear-gradient(90deg, #818cf8, #a78bfa, #c084fc, #f472b6)',
                                boxShadow: '0 0 20px rgba(192,132,252,0.6), 0 0 40px rgba(244,114,182,0.4)',
                            }} />
                    </div>
                </motion.div>

                {/* ══ SCENE 5 — Leads Flowing Chaos ══ */}
                <motion.div style={{ opacity: s5Opacity }} className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <CinematicLeads active={scrollVal > 0.48 && scrollVal < 0.62} intensityProgress={s5Intensity} />

                    <div className="relative z-10 w-full max-w-xl mx-auto px-6 h-[300px] flex items-center justify-center">
                        {!s5ShowNumber ? (
                            <NotificationStack active={scrollVal > 0.48 && scrollVal < 0.58} />
                        ) : (
                            <div className="text-center relative">
                                <div className="absolute inset-0 blur-[80px] bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-60 animate-pulse" />
                                <div className="text-8xl md:text-[160px] font-black leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] relative z-10"
                                    style={{ background: 'linear-gradient(135deg, #fff, #fbcfe8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                    +126
                                </div>
                                <p className="text-pink-300 text-2xl md:text-3xl mt-4 font-bold tracking-wide relative z-10 uppercase">new leads this month</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* ══ SCENE 6 — Grid City Obvious Choice ══ */}
                <motion.div style={{ opacity: s6Opacity }} className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="text-center mb-16 px-6 relative z-10">
                        <h2 className="text-4xl md:text-6xl font-black tracking-tight drop-shadow-xl">
                            Become the{' '}
                            <span style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                obvious choice
                            </span>
                            <br /><span className="text-slate-500 font-light">in your market.</span>
                        </h2>
                    </div>
                    <div className="w-full max-w-5xl px-6 relative z-10">
                        <AdvancedCityMap active={scrollVal > 0.58 && scrollVal < 0.74} highlightProgress={s6Highlight} />
                    </div>
                </motion.div>

                {/* ══ SCENE 7 — Time Advantage ══ */}
                <motion.div style={{ opacity: s7Opacity }} className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="text-center mb-24 px-6 relative z-10">
                        <h2 className="text-4xl md:text-6xl font-black tracking-tight drop-shadow-xl">
                            Live in{' '}
                            <span style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                three days.
                            </span>
                            <br />
                            <span className="text-slate-600 font-light">Not three months.</span>
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-24 max-w-5xl w-full px-6 relative z-10">
                        <div className="text-center p-8 rounded-3xl border border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
                            <p className="text-slate-500 text-sm font-bold tracking-widest uppercase mb-8">Traditional Website</p>
                            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner relative">
                                <motion.div className="h-full bg-slate-600 rounded-full relative" style={{ width: s7BarLeftWidth }}>
                                    <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white/10 to-transparent" />
                                </motion.div>
                            </div>
                            <div className="mt-6 flex justify-between text-xs text-slate-600 font-medium font-mono uppercase">
                                <span>Day 1</span>
                                <span>Month 3+</span>
                            </div>
                        </div>
                        <div className="text-center p-8 rounded-3xl border border-indigo-500/20 bg-indigo-950/20 backdrop-blur-sm shadow-[0_0_40px_rgba(79,70,229,0.1)]">
                            <p className="text-indigo-400 text-sm font-bold tracking-widest uppercase mb-8 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]">Siteo Engine</p>
                            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                                <motion.div className="h-full rounded-full relative" style={{ width: s7BarRightWidth, background: 'linear-gradient(90deg, #818cf8, #c084fc, #f472b6)' }}>
                                    <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white/50 to-transparent animate-pulse" />
                                </motion.div>
                            </div>
                            <div className="mt-6 flex justify-between text-xs text-indigo-300 font-bold font-mono uppercase">
                                <span>Start</span>
                                <span className="drop-shadow-[0_0_5px_rgba(244,114,182,0.8)]">Live (72h)</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ══ SCENE 8 — Global Ecosystem Ecosystem ══ */}
                <motion.div style={{ opacity: s8Opacity }} className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none perspective-[1000px]">
                    {/* Ecosystem Background */}
                    <motion.div className="absolute inset-0"
                        style={{
                            rotateX: s8RotateX,
                            scale: s8Scale,
                            transformStyle: "preserve-3d"
                        }}>
                        {/* Grid Floor */}
                        <div className="absolute inset-0 w-[200vw] h-[200vh] -left-[50vw] -top-[50vh]" style={{
                            backgroundImage: `linear-gradient(rgba(129,140,248,0.1) 2px, transparent 2px), linear-gradient(90deg, rgba(129,140,248,0.1) 2px, transparent 2px)`,
                            backgroundSize: '100px 100px',
                            transform: 'rotateX(60deg) translateY(-20vh) translateZ(-500px)',
                            opacity: 0.3
                        }} />
                    </motion.div>

                    <div className="relative z-10 text-center max-w-5xl px-6 space-y-10 backdrop-blur-md p-16 rounded-[40px] border border-white/10 bg-black/50 shadow-2xl">
                        <p className="text-4xl md:text-6xl font-light text-slate-300 leading-tight transition-opacity duration-1000 tracking-tight" style={{ opacity: s8T1 ? 1 : 0 }}>
                            Websites don't grow businesses.
                        </p>
                        <p className="text-5xl md:text-7xl font-black leading-tight transition-opacity duration-1000 delay-300 tracking-tighter"
                            style={{
                                opacity: s8T2 ? 1 : 0,
                                background: 'linear-gradient(135deg, #818cf8, #c084fc, #f472b6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}>
                            Client systems do.
                        </p>
                    </div>
                </motion.div>

                {/* ══ FINAL SCENE — Convergence and Call to Action ══ */}
                <motion.div style={{ opacity: s9Opacity }} className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-[#03060d]">
                    <ConvergenceCTA active={scrollVal > 0.92} convergenceProgress={s9Convergence} />

                    {/* Footer fades in at the very end */}
                    <footer className="absolute bottom-0 left-0 right-0 border-t border-white/5 bg-[#03060d]/80 backdrop-blur-md pointer-events-auto transition-opacity duration-1000 delay-1000"
                        style={{ opacity: scrollVal > 0.98 ? 1 : 0 }}>
                        <div className="container mx-auto px-6 max-w-6xl py-8">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-black tracking-tighter text-white">
                                        site<span style={{ background: 'linear-gradient(135deg, #818cf8, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>o</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-6 text-xs text-slate-500 font-medium">
                                    <a href="/privacy" className="hover:text-indigo-400 transition-colors">Privacy Policy</a>
                                    <a href="mailto:siteoteam@gmail.com" className="hover:text-indigo-400 transition-colors">siteoteam@gmail.com</a>
                                    <Link to="/admin" className="hover:text-amber-500 transition-colors">Admin Login</Link>
                                </div>
                            </div>
                        </div>
                    </footer>
                </motion.div>

            </motion.div>

            {/* Hidden Intake Modal, triggered by CTA button */}
            <div id="intake-modal" className="fixed inset-0 z-[100] flex items-center justify-center px-4 hidden">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.classList.contains('absolute')) {
                        document.getElementById('intake-modal')?.classList.add('hidden')
                    }
                }} />
                <div className="relative bg-slate-900 border border-slate-700/50 rounded-3xl p-8 max-w-md w-full shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-modalIn">
                    <button onClick={() => document.getElementById('intake-modal')?.classList.add('hidden')} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors text-xl font-light">×</button>
                    <h3 className="text-3xl font-black mb-3 text-white">Let's build your system</h3>
                    <p className="text-slate-400 text-sm mb-8 leading-relaxed font-light">Tell us about your business and we'll have your client acquisition system live in 3 days.</p>
                    <div className="space-y-4">
                        <input className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all shadow-inner" placeholder="Your name" />
                        <input className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all shadow-inner" placeholder="Email address" />
                        <input className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all shadow-inner" placeholder="Business name" />
                        <button className="w-full mt-4 py-4 rounded-xl font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/30"
                            style={{ background: 'linear-gradient(135deg, #4f46e5, #9333ea, #ec4899)' }}>
                            Get Started
                        </button>
                    </div>
                    <p className="text-center text-slate-500 text-[11px] mt-6 font-medium uppercase tracking-wider">No credit card required. Live in 3 days.</p>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes travelPath {
                    0% { stroke-dashoffset: 100; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { stroke-dashoffset: -10; opacity: 0; }
                }
            `}} />
        </div>
    )
}
