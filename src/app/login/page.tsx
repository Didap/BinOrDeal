"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Nav } from "@/components/nav"
import { Footer } from "@/components/footer"
import { ArrowRight, Loader2, Mail, Lock } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        alert("Controlla la tua email per confermare l'account!")
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        window.location.href = "/"
      }
    } catch (err: any) {
      setError(err.message || "Si è verificato un errore")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <Nav compact />
      
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="border-2 border-ink bg-surface p-8 sm:p-10 shadow-[8px_8px_0_var(--ink)] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h1 className="display text-4xl font-black tracking-tightest leading-none">
                {mode === "signin" ? "Bentornato" : "Crea Account"}
              </h1>
              <p className="mt-2 text-ink-soft font-mono text-[11px] uppercase tracking-widest">
                {mode === "signin" 
                  ? "Accedi per sbloccare le tue ricerche" 
                  : "Sblocca 10 ricerche gratuite al giorno"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6">
              <div className="grid gap-2">
                <label className="font-mono text-[10px] uppercase tracking-widest font-bold text-ink-muted">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tua@email.com"
                    className="w-full bg-paper border-2 border-ink p-4 pl-12 font-mono text-sm focus:outline-none focus:bg-deal/5 focus:border-deal transition-all"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="font-mono text-[10px] uppercase tracking-widest font-bold text-ink-muted">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-paper border-2 border-ink p-4 pl-12 font-mono text-sm focus:outline-none focus:bg-deal/5 focus:border-deal transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-500 text-red-600 font-mono text-[11px] uppercase tracking-wider">
                  {error === "Invalid login credentials" ? "Credenziali non valide" : error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-ink text-paper py-4 font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-deal transition-all active:translate-y-1 disabled:opacity-50 disabled:translate-y-0"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {mode === "signin" ? "Accedi" : "Registrati"} <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t-2 border-line text-center">
              <button
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="font-mono text-[11px] uppercase tracking-widest text-ink-muted hover:text-ink transition-colors"
              >
                {mode === "signin" 
                  ? "Non hai un account? Registrati" 
                  : "Hai già un account? Accedi"}
              </button>
            </div>
          </div>
          
          <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-widest text-ink-muted/50">
            Bin or Deal — Marketplace Aggregator
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
