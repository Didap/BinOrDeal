"use client"

import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/cn"

interface Props {
  className?: string
  label?: string
}

export function UpgradeButton({ className, label = "Passa a Pro Ora" }: Props) {
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/checkout", {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error("Checkout failed:", error)
      alert("Si è verificato un errore durante l'avvio del pagamento. Riprova più tardi.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={isLoading}
      className={cn(
        "group relative flex items-center justify-center gap-2 px-8 py-4 bg-deal text-paper font-mono text-sm uppercase tracking-[0.2em] font-black border-2 border-ink shadow-[8px_8px_0_var(--ink)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={18} />
      ) : (
        <>
          <Sparkles size={18} className="group-hover:animate-pulse" />
          {label}
        </>
      )}
    </button>
  )
}
