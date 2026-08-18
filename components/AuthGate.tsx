'use client'
import { FormEvent, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, GlassWater, LockKeyhole, Wine } from 'lucide-react'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [signup, setSignup] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => subscription.unsubscribe()
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage('')
    const result = signup
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (result.error) setMessage(result.error.message)
    else if (signup && !result.data.session) setMessage('Konto opprettet. Sjekk e-posten og bekreft kontoen.')
  }

  if (loading) return <div className="authscreen"><div className="authloading"><Wine/><span>Laster MoBar…</span></div></div>
  if (!session) return <div className="authscreen">
    <div className="authshell">
      <section className="authintro">
        <div className="authbrand"><div className="authlogo"><Wine/></div><div><strong>MoBar</strong><span>din digitale hjemmebar</span></div></div>
        <div className="authcopy"><p className="authkicker">COCKTAILS · BEHOLDNING · HANDLELISTE</p><h1>Vet hva du kan lage.<br/>Og hva du snart er tom for.</h1><p>MoBar holder styr på oppskrifter og faktisk mengde i hver flaske, slik at baren din ikke baserer seg på den tradisjonelle måleenheten «tror det er litt igjen».</p></div>
        <div className="authfeatures"><div><CheckCircle2/><span><b>Automatisk lager</b><small>Trekkes når du lager en drink</small></span></div><div><GlassWater/><span><b>Finn cocktails</b><small>Søk i oppskrifter og egne favoritter</small></span></div><div><LockKeyhole/><span><b>Din private bar</b><small>Data er knyttet til din konto</small></span></div></div>
      </section>
      <form className="authcard" onSubmit={submit}>
        <p className="authkicker">{signup?'NY KONTO':'VELKOMMEN TILBAKE'}</p>
        <h2>{signup?'Opprett MoBar-konto':'Logg inn'}</h2>
        <p>{signup?'Start med å registrere hva du har i barskapet.':'Fortsett der du slapp sist.'}</p>
        <label>E-post<input type="email" autoComplete="email" required placeholder="navn@epost.no" value={email} onChange={e=>setEmail(e.target.value)}/></label>
        <label>Passord<input type="password" autoComplete={signup?'new-password':'current-password'} required minLength={6} placeholder="Minst 6 tegn" value={password} onChange={e=>setPassword(e.target.value)}/></label>
        {message&&<div className="authmsg">{message}</div>}
        <button className="authsubmit" disabled={busy}>{busy?'Jobber…':signup?'Opprett konto':'Logg inn'}</button>
        <div className="authdivider"><span>eller</span></div>
        <button type="button" className="linkbtn" onClick={()=>{setSignup(!signup);setMessage('')}}>{signup?'Har du allerede konto? Logg inn':'Ny her? Opprett konto'}</button>
      </form>
    </div>
  </div>
  return <>{children}</>
}
