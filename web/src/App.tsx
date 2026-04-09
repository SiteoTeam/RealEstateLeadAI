/**
 * Agent Importer App
 * 
 * Main application component - composed of features.
 * Now supports "Import" and "Leads Dashboard" views.
 */

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Session, AuthChangeEvent } from '@supabase/supabase-js'
import { PlatformLogin } from './pages/PlatformLogin'
import { Header } from './components/layout/Header'
import { HelmetProvider } from 'react-helmet-async'
import { AgentInput } from './components/agent/AgentInput'
import { AgentCard } from './components/agent/AgentCard'

import { LeadsList } from './components/leads/LeadsList'
import { BulkImport } from './components/import/BulkImport'
import { EmailLogs } from './components/admin/EmailLogs'
import { ColdCallsList } from './components/coldcalls/ColdCallsList'
import { Background } from './components/ui/Background'
import { Tabs } from './components/layout/Tabs'

import { extractProfile, isValidCBUrl } from './services/api'
import type { CBAgentProfile } from './types/agent'
import './App.css'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase: any = null

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey)
  } catch (e) {
    console.error('Supabase init failed', e);
  }
} else {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

function App() {
  // If config is missing, show error screen immediately
  if (!supabase) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-red-500 p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Configuration Error</h1>
        <p>Missing Supabase Environment Variables.</p>
        <p className="text-sm text-slate-400 mt-2">Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment settings.</p>
      </div>
    )
  }

  const [session, setSession] = useState<Session | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [view, setView] = useState('import') // 'import' | 'leads'
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<CBAgentProfile | null>(null)
  // 'preview' is initial loaded state. 'saved' is when verified in DB.
  const [saveState, setSaveState] = useState<'preview' | 'saving' | 'saved'>('preview')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session)
      setCheckingAuth(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (checkingAuth) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-500">Loading...</div>
  }

  if (!session) {
    return <PlatformLogin />
  }

  const handleExtract = async () => {
    if (!url) {
      setError('Please enter a profile URL')
      return
    }

    if (!isValidCBUrl(url)) {
      setError('Please enter a valid Coldwell Banker agent profile URL')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setProfile(null)
      setSaveState('preview')

      const data = await extractProfile(url)

      if (!data.extraction_success) {
        setError(data.extraction_errors.join(', ') || 'Failed to extract profile')
        return
      }

      setProfile(data)
      // If the backend auto-saved it, update the state immediately
      if (data.saved_to_db) {
        setSaveState('saved')
      }

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }


  const handleReset = () => {
    setProfile(null)
    setUrl('')
    setSaveState('preview')
    setError(null)
  }

  return (
    <HelmetProvider>
      <div className="min-h-screen text-slate-100 font-sans selection:bg-indigo-500/30 relative">
        <Background />

        <div className="relative z-10">
          <Header />

          <main className={`container mx-auto px-4 py-4 sm:py-8 transition-all duration-300 ${['leads', 'coldcalls', 'emails'].includes(view) ? 'max-w-[1600px]' : 'max-w-5xl'}`}>
            <Tabs
              views={[
                { id: 'import', label: 'Single Import' },
                { id: 'bulk', label: 'Bulk Import' },
                { id: 'leads', label: 'My Leads' },
                { id: 'coldcalls', label: 'Cold Calls' },
                { id: 'emails', label: 'Email Logs' }
              ]}
              currentView={view}
              onChange={setView}
            />

            {view === 'import' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Input Section */}
                {!profile && (
                  <>
                    <AgentInput
                      url={url}
                      isLoading={loading}
                      onUrlChange={setUrl}
                      onSubmit={handleExtract}
                      buttonText="Fetch Profile"
                    />

                    {/* Error Message */}
                    {error && (
                      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 backdrop-blur-md rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 shadow-lg">
                        <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-red-400 text-sm">{error}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Loading State */}
                {loading && !profile && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-slate-700/50 border-t-indigo-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-indigo-500">CB</span>
                      </div>
                    </div>
                    <p className="mt-4 text-slate-400 font-medium animate-pulse">Analyzing Agent Profile...</p>
                    <p className="text-xs text-slate-600 mt-2">Connecting to Coldwell Banker Realty</p>
                  </div>
                )}

                {/* Results Section */}
                {profile && (
                  <div className="animate-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <span className="w-2 h-8 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"></span>
                        Extracted Profile
                      </h2>
                      <button
                        onClick={handleReset}
                        className="text-slate-400 hover:text-white text-sm font-medium hover:underline transition-colors"
                      >
                        ← Extract Another
                      </button>
                    </div>

                    <AgentCard
                      profile={profile}
                      state={saveState}
                      onSave={() => { }}
                      onCancel={handleReset}
                    />
                  </div>
                )}
              </div>
            )}

            {view === 'bulk' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <BulkImport />
              </div>
            )}

            {view === 'leads' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <LeadsList />
              </div>
            )}

            {view === 'emails' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <EmailLogs />
              </div>
            )}

            {view === 'coldcalls' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ColdCallsList />
              </div>
            )}
          </main>
        </div>
      </div>
    </HelmetProvider>
  )
}

export default App
