"use client"
import Link from "next/link"
import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { Lock, ArrowRight, Zap } from "lucide-react"
import type { QuotaStatus } from "@/lib/quota"

export function QuotaGate({ status }: { status: QuotaStatus }) {
  return (
    <div className="max-w-xl mx-auto py-12 px-6 border-2 border-ink bg-surface shadow-[8px_8px_0_rgba(21,18,13,0.1)] rise">
      <div className="flex flex-col items-center text-center">
        <div className="size-16 bg-ink text-paper grid place-items-center mb-6">
          <Lock size={32} />
        </div>
        
        <h2 className="display text-3xl sm:text-4xl font-black tracking-tightest leading-tight">
          {status.reason === "auth_required" 
            ? "Limite ricerche anonime raggiunto" 
            : "Quota giornaliera esaurita"}
        </h2>
        
        <p className="mt-4 text-lg text-ink-soft leading-snug">
          {status.reason === "auth_required"
            ? "Le ricerche anonime sono limitate a 3 per sessione. Crea un account gratuito per sbloccare altre 10 ricerche al giorno."
            : "Hai esaurito le tue 10 ricerche gratuite per oggi. Passa a Pro per ricerche illimitate e alert in tempo reale."}
        </p>

        <div className="mt-8 grid gap-4 w-full">
          {status.reason === "auth_required" ? (
            <>
              <SignUpButton mode="modal">
                <button className="w-full bg-deal text-paper py-4 font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-deal-deep transition-colors">
                  Crea Account Gratuito <ArrowRight size={18} />
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="w-full border-2 border-ink py-4 font-mono font-bold uppercase tracking-widest hover:bg-paper-deep transition-colors">
                  Accedi
                </button>
              </SignInButton>
            </>
          ) : (
            <>
              <Link href="/#pricing" className="w-full bg-ink text-paper py-4 font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-deal transition-colors">
                Passa a Pro <Zap size={18} className="fill-current" />
              </Link>
              <Link href="/" className="w-full border-2 border-ink py-4 font-mono font-bold uppercase tracking-widest hover:bg-paper-deep transition-colors text-center">
                Torna alla Home
              </Link>
            </>
          )}
        </div>

        <div className="mt-10 pt-6 border-t border-line w-full text-[11px] font-mono uppercase tracking-widest text-ink-muted">
          Perché questo limite? <br />
          <span className="normal-case tracking-normal block mt-1">
            Aggregare 4 marketplace in tempo reale è costoso. I limiti ci aiutano a mantenere il servizio sostenibile per tutti.
          </span>
        </div>
      </div>
    </div>
  )
}
