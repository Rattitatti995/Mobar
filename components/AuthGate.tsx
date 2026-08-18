'use client'
import { FormEvent, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Wine } from 'lucide-react'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [signup, setSignup] = useState(false)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => subscription.unsubscribe()
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setMessage('')
    const result = signup
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email, password })
    if (result.error) setMessage(result.error.message)
    else if (signup && !result.data.session) setMessage('Konto opprettet. Sjekk e-posten og bekreft kontoen.')
  }

  if (!supabase) return <>{children}</>
  if (loading) return <div className="authscreen"><div className="authcard">Laster MoBar…</div></div>
  if (!session) return <div className="authscreen"><form className="authcard" onSubmit={submit}><div className="authlogo"><Wine /></div><h1>MoBar</h1><p>{signup ? 'Lag konto til hjemmebaren' : 'Logg inn til hjemmebaren'}</p><input type="email" required placeholder="E-post" value={email} onChange={e => setEmail(e.target.value)} /><input type="password" required minLength={6} placeholder="Passord" value={password} onChange={e => setPassword(e.target.value)} />{message && <div className="authmsg">{message}</div>}<button>{signup ? 'Opprett konto' : 'Logg inn'}</button><button type="button" className="linkbtn" onClick={() => { setSignup(!signup); setMessage('') }}>{signup ? 'Har du konto? Logg inn' : 'Ny bruker? Opprett konto'}</button></form></div>
  return <>{children}</>
}
