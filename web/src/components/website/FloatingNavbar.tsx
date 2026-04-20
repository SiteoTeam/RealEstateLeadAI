import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import { type DBProfile } from '../../services/api'
import { Menu, X } from 'lucide-react'

interface FloatingNavbarProps {
    agent: DBProfile
    onBookClick: () => void
    sourceContext?: string | null
}

export function FloatingNavbar({ agent, onBookClick, sourceContext }: FloatingNavbarProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const { scrollY } = useScroll()

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 50)
    })

    const navLinks = [
        { label: 'Home', id: 'hero' },
        { label: 'About', id: 'about' },
        { label: 'Services', id: 'services' },
        { label: 'Contact', id: 'contact' },
    ]

    return (
        <>
            {/* Desktop Floating Pill Navbar */}
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="fixed top-6 left-1/2 -translate-x-1/2 z-50 hidden md:block"
            >
                <motion.div
                    animate={{
                        padding: isScrolled ? '12px 24px' : '16px 32px',
                        backgroundColor: isScrolled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.8)',
                    }}
                    className="rounded-full backdrop-blur-xl border border-white/20 shadow-lg shadow-black/5 flex items-center gap-8"
                >
                    {/* Logo / Name */}
                    <a
                        href="#hero"
                        className="font-serif font-bold text-lg text-slate-900 tracking-tight hover:text-primary transition-colors"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        {agent.full_name.split(' ')[0]}
                    </a>

                    {/* Divider */}
                    <div className="w-px h-5 bg-slate-200" />

                    {/* Links */}
                    <div className="flex items-center gap-6">
                        {navLinks.slice(1).map((link) => (
                            <a
                                key={link.id}
                                href={`#${link.id}`}
                                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors relative group"
                            >
                                {link.label}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                            </a>
                        ))}
                    </div>

                    {/* CTA */}
                    <motion.button
                        onClick={onBookClick}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`ml-2 px-5 py-2 text-sm font-semibold rounded-full transition-colors ${sourceContext === 'email' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                    >
                        {sourceContext === 'email' ? 'Claim This Website' : "Let's Talk"}
                    </motion.button>
                </motion.div>
            </motion.nav>

            {/* Mobile Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 md:hidden bg-white/90 backdrop-blur-md border-b border-slate-100 h-16 flex items-center justify-between px-6">
                <a
                    href="#hero"
                    onClick={() => setIsOpen(false)}
                    className="font-serif font-bold text-lg text-slate-900"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                >
                    {agent.full_name.split(' ')[0]}
                </a>
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 -mr-2 text-slate-700 active:scale-95 transition-transform"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </nav>

            {/* Mobile Fullscreen Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[60] bg-white flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 h-16 border-b border-slate-100">
                            <span className="font-serif font-bold text-lg text-slate-900">
                                Menu
                            </span>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 -mr-2 text-slate-700 active:scale-95 transition-transform"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Links */}
                        <div className="flex flex-col p-8 gap-6 overflow-y-auto">
                            <div className="space-y-6">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Explore</p>
                                {navLinks.map((link) => (
                                    <a
                                        key={link.id}
                                        href={`#${link.id}`}
                                        onClick={() => setIsOpen(false)}
                                        className="block text-3xl font-serif text-slate-900 active:text-primary transition-colors"
                                        style={{ fontFamily: "'Playfair Display', serif" }}
                                    >
                                        {link.label}
                                    </a>
                                ))}
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-100">
                                <button
                                    onClick={() => {
                                        setIsOpen(false)
                                        onBookClick()
                                    }}
                                    className={`w-full py-4 text-white font-bold rounded-xl active:scale-[0.98] transition-all ${sourceContext === 'email' ? 'bg-indigo-600' : 'bg-slate-900'}`}
                                >
                                    {sourceContext === 'email' ? 'Claim This Website' : "Let's Talk"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
