
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// Simple types for the audit data
interface AuditData {
    token: string;
    agentName: string;
    brokerage: string;
    websiteSlug?: string;
    status: 'pending' | 'completed';
    results?: {
        score: number;
        scenario: number;
        answers: {
            hasWebsite: boolean;
            hasFollowUp: boolean;
            noZillowRel: boolean;
        };
    };
}

export function AuditPage() {
    const { token } = useParams<{ token: string }>();
    const [audit, setAudit] = useState<AuditData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Flow State: 'intro' -> 'questions' -> 'analyzing' -> 'buffer' -> 'results'
    const [step, setStep] = useState<'intro' | 'questions' | 'analyzing' | 'buffer' | 'results'>('intro');

    // Answers State
    const [answers, setAnswers] = useState({
        hasWebsite: false,
        hasFollowUp: false,
        noZillowRel: false
    });

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    // 1. Initial Load
    useEffect(() => {
        const fetchAudit = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/audit/${token}`);
                if (!res.ok) {
                    if (res.status === 410) throw new Error('This audit link has expired.');
                    if (res.status === 503) throw new Error('System under maintenance.');
                    throw new Error('Audit not found.');
                }
                const data = await res.json();
                setAudit(data);

                // If already completed, jump to results
                if (data.status === 'completed') {
                    setStep('results');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchAudit();
    }, [token]);

    // --- ANIMATION STATE ---
    const [analysisStep, setAnalysisStep] = useState(0);
    const analysisSteps = [
        { label: 'Connecting to domain...', duration: 800 },
        { label: 'Analyzing mobile responsiveness...', duration: 1500 },
        { label: 'Checking SSL & security headers...', duration: 1200 },
        { label: 'Measuring page load performance...', duration: 1500 },
        { label: 'Scanning for lead capture forms...', duration: 1200 },
        { label: 'Benchmarking against local competitors...', duration: 1500 },
        { label: 'Finalizing health score...', duration: 1000 },
    ];

    // --- SCORE ANIMATION STATE ---
    const [scoreDisplay, setScoreDisplay] = useState(0);

    useEffect(() => {
        if (step === 'results' && audit?.results?.score) {
            let start = 0;
            const end = audit.results.score;
            const duration = 2000;
            const increment = end / (duration / 16); // 60fps

            const timer = setInterval(() => {
                start += increment;
                if (start >= end) {
                    setScoreDisplay(end);
                    clearInterval(timer);
                } else {
                    setScoreDisplay(Math.round(start));
                }
            }, 16);

            return () => clearInterval(timer);
        }
    }, [step, audit]);

    // 2. Submit Logic
    const handleSubmit = async () => {
        setStep('analyzing');

        // Trigger the backend submission immediately in background
        const submitPromise = fetch(`${API_BASE}/api/audit/${token}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers })
        }).then(res => {
            if (!res.ok) throw new Error('Failed to save results');
            return res.json();
        }).catch(err => {
            console.error('Submission error:', err);
            return null; // Handle silently for now, show results anyway
        });

        // Run through animation steps
        for (let i = 0; i < analysisSteps.length; i++) {
            setAnalysisStep(i);
            await new Promise(resolve => setTimeout(resolve, analysisSteps[i].duration));
        }

        // Wait for actual submission if it's somehow still pending (unlikely with long animation)
        const data = await submitPromise;

        if (data) {
            setAudit(prev => prev ? {
                ...prev,
                status: 'completed',
                results: {
                    score: data.results.score,
                    scenario: data.results.scenario,
                    answers: data.results.answers
                }
            } : null);
        }

        setStep('buffer');
    };

    // ... (render logic)

    // 3. ANALYZING
    if (step === 'analyzing') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
                <div className="w-full max-w-md">
                    {/* Progress Bar */}
                    <div className="h-2 bg-slate-200 rounded-full mb-8 overflow-hidden">
                        <div
                            className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                            style={{ width: `${((analysisStep + 1) / analysisSteps.length) * 100}%` }}
                        ></div>
                    </div>

                    {/* Active Step */}
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 mb-6 relative">
                            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center font-bold text-indigo-600 text-sm">
                                {Math.round(((analysisStep + 1) / analysisSteps.length) * 100)}%
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-slate-800 mb-2">Running Diagnostic</h2>
                        <p className="text-slate-500 h-6 transition-all duration-300">
                            {analysisSteps[analysisStep]?.label}
                        </p>
                    </div>

                    {/* Completed Steps Log */}
                    <div className="mt-8 space-y-3">
                        {analysisSteps.map((s, i) => (
                            <div
                                key={i}
                                className={`flex items-center gap-3 text-sm transition-all duration-500 ${i < analysisStep
                                    ? 'opacity-100 translate-x-0'
                                    : i === analysisStep
                                        ? 'opacity-100 font-medium text-indigo-600 scale-105 origin-left'
                                        : 'opacity-0 -translate-x-4 h-0 overflow-hidden'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${i < analysisStep ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'
                                    }`}>
                                    {i < analysisStep ? (
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                                    )}
                                </div>
                                <span className={i < analysisStep ? 'text-slate-400' : 'text-slate-800'}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border-l-4 border-red-500">
                <h1 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h1>
                <p className="text-slate-600">{error}</p>
            </div>
        </div>
    );

    if (!audit) return null;

    // --- RENDER STEPS ---

    // 1. INTRO
    if (step === 'intro') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans selection:bg-indigo-100 selection:text-indigo-900 relative overflow-hidden">

                {/* Background Effects */}
                <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-300 rounded-full blur-[120px] opacity-30 animate-pulse"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-300 rounded-full blur-[120px] opacity-30 animate-pulse delay-1000"></div>
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.5 }}></div>
                </div>
                <div className="max-w-xl w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 relative z-10 animate-in zoom-in duration-500">
                    {/* Top decoration */}
                    <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                    <div className="p-8 md:p-12 text-center">
                        {/* Exclusivity Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-widest mb-8 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            Exclusive Invite • Limited Access
                        </div>

                        <div className="w-20 h-20 bg-white text-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-100 border border-white animate-in slide-in-from-bottom-4 fade-in duration-700 delay-200">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 tracking-tight leading-tight animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300">
                            Private Digital Audit for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{audit.agentName}</span>
                        </h1>

                        <p className="text-slate-600 text-lg mb-8 leading-relaxed max-w-sm mx-auto animate-in slide-in-from-bottom-4 fade-in duration-700 delay-400">
                            You have been selected as one of the top <strong className="text-slate-900">200 {audit.brokerage} agents</strong> to receive this comprehensive digital footprint analysis.
                        </p>

                        <button
                            onClick={() => setStep('questions')}
                            className="w-full bg-slate-900 text-white font-bold text-lg py-4 rounded-xl hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-3 group animate-in slide-in-from-bottom-4 fade-in duration-700 delay-500 relative overflow-hidden"
                        >
                            <svg className="w-5 h-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                            <span>Unlock My Analysis</span>
                        </button>

                        <div className="mt-8 pt-8 border-t border-slate-200/60 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-700">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Trusted by top producing agents at</p>
                            <div className="flex flex-nowrap items-center justify-center gap-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                                {/* Keller Williams */}
                                <div className="h-5 w-auto flex-shrink-0">
                                    <svg viewBox="0 0 100 30" className="h-full w-auto fill-current text-slate-600 hover:text-[#B40101]">
                                        <path d="M10,0 L0,0 L0,30 L10,30 L10,18 L18,30 L30,30 L18,12 L28,0 L18,0 L10,10 L10,0 Z M45,0 L35,0 L42,30 L52,30 L55,15 L58,30 L68,30 L75,0 L65,0 L62,18 L58,0 L52,0 L48,18 L45,0 Z" />
                                    </svg>
                                </div>
                                {/* RE/MAX */}
                                <div className="h-4 w-auto flex-shrink-0">
                                    <svg viewBox="0 0 120 30" className="h-full w-auto fill-current text-slate-600 hover:text-[#DC1C2E]">
                                        <text x="0" y="22" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="24">RE/MAX</text>
                                    </svg>
                                </div>
                                {/* Coldwell Banker */}
                                <div className="h-5 w-auto flex-shrink-0">
                                    <svg viewBox="0 0 280 30" className="h-full w-auto fill-current text-slate-600 hover:text-[#00285F]">
                                        <rect x="0" y="0" width="30" height="30" rx="0" fill="currentColor" />
                                        <text x="5" y="21" fill="white" fontFamily="Times New Roman, serif" fontWeight="bold" fontSize="18">CB</text>
                                        <text x="38" y="21" fontFamily="Times New Roman, serif" fontWeight="400" fontSize="16" letterSpacing="0.5">COLDWELL BANKER REALTY</text>
                                        <rect x="38" y="2" width="240" height="1" fill="currentColor" opacity="0.5" />
                                        <rect x="38" y="27" width="240" height="1" fill="currentColor" opacity="0.5" />
                                    </svg>
                                </div>
                                {/* eXp */}
                                <div className="h-5 w-auto flex-shrink-0">
                                    <svg viewBox="0 0 80 30" className="h-full w-auto fill-current text-slate-600 hover:text-[#F37321]">
                                        <text x="0" y="22" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="24" fontStyle="italic">eXp</text>
                                        <path d="M50,5 L70,5 L60,25 Z" fill="#F37321" opacity="0.8" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-center gap-6 text-xs font-semibold text-slate-400 uppercase tracking-wider animate-in slide-in-from-bottom-4 fade-in duration-700 delay-600">
                            <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                Secure
                            </span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                Private
                            </span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>Expires in 7 Days</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 2. QUESTIONS
    if (step === 'questions') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans selection:bg-indigo-100 selection:text-indigo-900 relative overflow-hidden">

                {/* Background Effects */}
                <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
                    <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-300 rounded-full blur-[120px] opacity-30 animate-pulse"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-300 rounded-full blur-[120px] opacity-30 animate-pulse delay-1000"></div>
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.5 }}></div>
                </div>

                <div className="max-w-xl w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden p-8 border border-white/50 relative z-10 animate-in zoom-in duration-500">
                    <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 absolute top-0 left-0 w-full"></div>

                    <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center tracking-tight animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100">Configuration Check</h2>

                    <div className="space-y-6">
                        {/* Q1 */}
                        <div className="p-5 border border-slate-200/60 rounded-2xl hover:border-indigo-300 hover:bg-white/50 transition-all duration-300 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-200">
                            <p className="font-medium text-slate-700 mb-4 text-lg">Are you satisfied with your current website?</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setAnswers(p => ({ ...p, hasWebsite: true }))}
                                    className={`flex-1 py-3 rounded-lg font-bold transition-all border-2 ${answers.hasWebsite ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                >
                                    Yes
                                </button>
                                <button
                                    onClick={() => setAnswers(p => ({ ...p, hasWebsite: false }))}
                                    className={`flex-1 py-3 rounded-lg font-bold transition-all border-2 ${!answers.hasWebsite ? 'bg-slate-800 border-slate-800 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                >
                                    No
                                </button>
                            </div>
                        </div>

                        {/* Q2 */}
                        <div className="p-5 border border-slate-200/60 rounded-2xl hover:border-indigo-300 hover:bg-white/50 transition-all duration-300 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300">
                            <p className="font-medium text-slate-700 mb-4 text-lg">Do you have an automated text follow-up system?</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setAnswers(p => ({ ...p, hasFollowUp: true }))}
                                    className={`flex-1 py-3 rounded-lg font-bold transition-all border-2 ${answers.hasFollowUp ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                >
                                    Yes
                                </button>
                                <button
                                    onClick={() => setAnswers(p => ({ ...p, hasFollowUp: false }))}
                                    className={`flex-1 py-3 rounded-lg font-bold transition-all border-2 ${!answers.hasFollowUp ? 'bg-slate-800 border-slate-800 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                >
                                    No
                                </button>
                            </div>
                        </div>

                        {/* Q3 */}
                        <div className="p-5 border border-slate-200/60 rounded-2xl hover:border-indigo-300 hover:bg-white/50 transition-all duration-300 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-400">
                            <p className="font-medium text-slate-700 mb-4 text-lg">Is Zillow/Realtor.com your primary lead source?</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setAnswers(p => ({ ...p, noZillowRel: false }))} // Yes means they Rely on it (Bad)
                                    className={`flex-1 py-3 rounded-lg font-bold transition-all border-2 ${!answers.noZillowRel ? 'bg-slate-800 border-slate-800 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                >
                                    Yes
                                </button>
                                <button
                                    onClick={() => setAnswers(p => ({ ...p, noZillowRel: true }))} // No means they don't rely (Good)
                                    className={`flex-1 py-3 rounded-lg font-bold transition-all border-2 ${answers.noZillowRel ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                >
                                    No
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="w-full mt-8 bg-slate-900 text-white font-bold text-lg py-4 rounded-xl hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-500"
                    >
                        Calculate Score
                    </button>
                </div>
            </div>
        );
    }



    // 4. BUFFER
    if (step === 'buffer') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-center">
                <div className="max-w-lg w-full">
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-8 mx-auto animate-in zoom-in duration-500">
                        <svg className="w-12 h-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">Analysis Complete</h2>
                    <p className="text-slate-500 text-xl mb-12 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        We found <strong className="text-violet-600">3 critical optimizations</strong> that could double your lead capture rate.
                    </p>
                    <button
                        onClick={() => setStep('results')}
                        className="w-full bg-indigo-600 text-white font-bold text-xl py-5 rounded-2xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-200 transform hover:-translate-y-1"
                    >
                        View Your Score &rarr;
                    </button>
                </div>
            </div>
        );
    }

    // 5. RESULTS — Scenario-Driven

    const scenario = audit.results?.scenario || 4;
    const resultAnswers = audit.results?.answers || { hasWebsite: false, hasFollowUp: false, noZillowRel: false };

    // Score color by scenario
    const scoreColor = scenario === 1 ? 'text-emerald-500' : scenario === 2 ? 'text-amber-500' : 'text-red-500';

    // --- Scenario Content Engine ---
    type CardData = { title: string; copy: string; passing: boolean };

    const getCards = (): CardData[] => {
        const websiteCard: CardData = resultAnswers.hasWebsite
            ? { title: '✓ Website Active', copy: 'You have an owned web presence — a strong foundation.', passing: true }
            : { title: 'No Owned Platform', copy: "Leads searching your name find brokerage pages, not yours. You don't control the experience.", passing: false };

        const followUpCard: CardData = resultAnswers.hasFollowUp
            ? { title: '✓ Follow-Up System', copy: 'Automated follow-up keeps you ahead of the competition.', passing: true }
            : { title: 'Manual Response Gap', copy: '78% of leads go to the first responder. Without automation, you\'re always second.', passing: false };

        const zillowCard: CardData = resultAnswers.noZillowRel
            ? { title: '✓ Diversified Leads', copy: 'You\'re not dependent on a single portal for your pipeline.', passing: true }
            : { title: 'Portal Dependency', copy: 'Zillow owns your leads. One algorithm change and your pipeline disappears overnight.', passing: false };

        return [websiteCard, followUpCard, zillowCard];
    };

    const getScenarioContent = () => {
        switch (scenario) {
            case 1: return {
                headline: 'Your Digital Presence Is Strong',
                subheadline: `You're ahead of most agents in the ${audit.brokerage || 'your'} market. The areas below aren't problems — they're the gap between good and dominant.`,
                sectionTitle: 'Opportunities to Scale',
                ctaHeading: 'See What Top Agents See',
                ctaSub: 'Your foundation is solid. See how a purpose-built site elevates your brand above the competition.',
                cards: [
                    { title: 'Brand Differentiation', copy: 'Your setup works — but does it stand out from the next agent at your brokerage?', passing: true },
                    { title: 'Conversion Rate', copy: "Strong traffic means nothing if your capture rate isn't optimized for every visitor.", passing: true },
                    { title: 'Market Positioning', copy: 'Top 5% agents control their online narrative. Make sure yours tells the right story.', passing: true }
                ]
            };
            case 2: return {
                headline: "You're Close — One Gap Is Holding You Back",
                subheadline: "You've built a solid foundation, but there's a weak link in your pipeline that's costing you leads every week.",
                sectionTitle: 'Where You\'re Losing Ground',
                ctaHeading: 'Close the Gap',
                ctaSub: "You're one system away from a fully automated pipeline. See what it looks like with everything connected.",
                cards: getCards()
            };
            case 3: return {
                headline: 'Your Pipeline Has Gaps',
                subheadline: "You've got one piece working, but without the others, leads are slipping through faster than you can catch them.",
                sectionTitle: 'Issues Identified',
                ctaHeading: 'Fix Your Foundation',
                ctaSub: "Most agents don't realize how much they're leaving on the table. A single platform can close all of these gaps.",
                cards: getCards()
            };
            case 4: default: return {
                headline: 'You Need a Digital Foundation',
                subheadline: "Right now, you have no owned platform, no automated follow-up, and full dependency on portals. Every day without a system is leads lost.",
                sectionTitle: 'Critical Issues',
                ctaHeading: 'Start Building Your Pipeline',
                ctaSub: 'Every agent who dominates their market started with one decision — owning their digital presence.',
                cards: getCards()
            };
        }
    };

    const content = getScenarioContent();

    // ... (rest of logic) ...

    return (
        <div className="h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden flex flex-col relative selection:bg-indigo-100 selection:text-indigo-900">

            {/* Background Effects */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-300 rounded-full blur-[120px] opacity-30 animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-300 rounded-full blur-[120px] opacity-30 animate-pulse delay-1000"></div>
                {/* Simple Grid Pattern using radial gradient */}
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.5 }}></div>
            </div>

            {/* Nav */}
            <nav className="relative z-20 bg-white/70 backdrop-blur-md border-b border-slate-200/50 px-8 py-4 flex justify-between items-center shrink-0">
                <div className="font-bold text-xl tracking-tight flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
                    <span>Site<span className="text-indigo-600">o</span> Audit</span>
                </div>
                <div className="text-sm font-medium text-slate-500 bg-white/50 border border-slate-200 px-3 py-1 rounded-full">
                    Prepared for <span className="text-slate-900">{audit.agentName}</span>
                </div>
            </nav>

            {/* Main Dashboard Content - Split Screen */}
            <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-10 max-w-[1600px] mx-auto w-full h-full">

                {/* LEFT PANEL: The Diagnosis & Score */}
                <div className="lg:col-span-5 flex flex-col justify-center lg:pr-8 animate-in slide-in-from-bottom-4 duration-700">

                    {/* Score Ring Section */}
                    <div className="flex items-center gap-8 mb-10">
                        <div className="relative w-40 h-40 flex-shrink-0 flex items-center justify-center">
                            {/* Outer glow */}
                            <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 ${scenario === 1 ? 'bg-emerald-400' : scenario === 2 ? 'bg-amber-400' : 'bg-red-400'}`}></div>
                            <svg className="w-full h-full transform -rotate-90 drop-shadow-md">
                                <circle cx="80" cy="80" r="74" className="text-slate-200" strokeWidth="12" fill="none" stroke="currentColor" />
                                <circle
                                    cx="80" cy="80" r="74"
                                    className={`${scoreColor} transition-all duration-1000 ease-out`}
                                    strokeWidth="12"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeDasharray={465}
                                    strokeDashoffset={465 - (465 * scoreDisplay) / 100}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center animate-in zoom-in duration-700 delay-100">
                                <span className={`text-5xl font-extrabold tracking-tighter ${scoreColor}`}>{scoreDisplay}</span>
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Score</span>
                            </div>
                        </div>
                        <div>
                            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${scenario === 1 ? 'bg-emerald-100 text-emerald-700' : scenario === 2 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                {scenario === 1 ? 'Excellent' : scenario === 2 ? 'Needs Work' : 'Critical'}
                            </div>
                            <h2 className="text-4xl font-bold text-slate-900 leading-tight">Digital Health Check</h2>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
                            {content.headline}
                        </h1>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            {content.subheadline}
                        </p>

                        <div className="pt-8">
                            <a
                                href={audit.websiteSlug ? `/w/${audit.websiteSlug}?source=audit` : '#'}
                                className="group relative bg-slate-900 text-white font-bold text-lg py-4 px-8 rounded-xl hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 inline-flex items-center gap-3 overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    Preview Custom Site
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:animate-shimmer"></div>
                            </a>
                            <p className="mt-3 text-sm text-slate-500 font-medium">No credit card required. Instant preview.</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: Critical Cards */}
                <div className="lg:col-span-7 flex flex-col justify-center h-full">
                    <div className="grid grid-rows-3 gap-5 h-full max-h-[700px]">
                        {content.cards.map((card, i) => (
                            <div
                                key={i}
                                className={`relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl border transition-all duration-500 hover:shadow-lg hover:-translate-x-1 hover:bg-white group overflow-hidden flex flex-row items-center gap-6 animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards ${card.passing
                                    ? 'border-emerald-100 hover:border-emerald-200'
                                    : 'border-red-100 hover:border-red-200'
                                    }`}
                                style={{ animationDelay: `${300 + (i * 150)}ms` }}
                            >
                                {/* Side Indicator */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${card.passing ? 'bg-emerald-400' : 'bg-red-400'}`}></div>

                                {/* Icon Box */}
                                <div className={`w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center ${card.passing ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    {card.passing ? (
                                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="font-bold text-lg text-slate-800 truncate">{card.title}</h4>
                                        {!card.passing && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 uppercase tracking-wide">
                                                Critical
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-slate-600 text-sm leading-relaxed">{card.copy}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </main>
        </div>
    );
}
