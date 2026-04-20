import { Background } from '../components/ui/Background'

export function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-indigo-500/30">
            <Background />

            {/* Reusing the same header as the app/landing page */}
            <div className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-3 group relative cursor-pointer">
                        <div className="absolute -inset-2 bg-indigo-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] group-hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all duration-300 transform group-hover:scale-105">
                            S
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            Siteo
                        </span>
                    </a>
                </div>
            </div>

            <main className="container mx-auto px-6 py-20 max-w-4xl relative z-10">
                <div className="prose prose-invert prose-indigo max-w-none">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">Privacy Policy</h1>

                    <p className="text-lg text-slate-400 mb-12">
                        Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>

                    <section className="mb-12">
                        <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
                        <p className="mb-4">
                            We collect information that you manually provide to us through our forms, such as your name, email address, phone number, and business details. We also collect publicly available information about your business (such as existing website content and social media profiles) to provide our AI-driven website building and lead generation services.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
                        <p className="mb-4">
                            We use the information we collect to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Provide, operate, and maintain our services</li>
                            <li>Improve, personalize, and expand our services</li>
                            <li>Understand and analyze how you use our services</li>
                            <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the service, and for marketing and promotional purposes</li>
                            <li>Send you emails</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-semibold text-white mb-4">3. Email Communications & Opt-Out</h2>
                        <p className="mb-4">
                            By providing your email address, you consent to receive communications from us. We may send you service-related emails, promotional emails, and other information related to Siteo.
                        </p>
                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6 my-6">
                            <h3 className="text-xl font-medium text-white mb-2">How to Opt-Out</h3>
                            <p className="mb-0">
                                You can opt-out of receiving promotional emails at any time by:
                                <br />• Clicking the "unsubscribe" link provided at the bottom of our emails
                                <br />• Replying to any of our emails with "UNSUBSCRIBE"
                                <br />• Contacting us directly at <strong>siteoteam@gmail.com</strong>
                            </p>
                        </div>
                        <p className="mb-4 text-sm text-slate-400">
                            Please note that even if you opt-out of promotional emails, we may still send you non-promotional communications, such as those about your account, ongoing projects, or our ongoing business relations.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-semibold text-white mb-4">4. Data Sharing and Security</h2>
                        <p className="mb-4">
                            We do not sell your personal information to third parties. We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-semibold text-white mb-4">5. Changes to This Privacy Policy</h2>
                        <p className="mb-4">
                            We may update this privacy policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal, or regulatory reasons.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-semibold text-white mb-4">6. Contact Us</h2>
                        <p className="mb-4">
                            If you have questions or comments about this Privacy Policy, please contact us at:
                            <br /><br />
                            <strong>Email:</strong> siteoteam@gmail.com
                            <br />
                            <strong>Phone:</strong> (626) 884-9546
                        </p>
                    </section>
                </div>
            </main>

            <footer className="relative z-10 border-t border-white/5 py-8 mt-12 bg-slate-950/50 backdrop-blur-xl">
                <div className="container mx-auto px-6 text-center text-slate-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} Siteo. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
} 
