"use client"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X, ArrowRight } from "lucide-react"
import { useAuth, SignInButton, UserButton } from "@clerk/nextjs"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/cn"

interface Props {
  className?: string
  compact?: boolean
}

export function Nav({ className, compact }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const { userId, isLoaded } = useAuth()

  // Block scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur-md",
          className,
        )}
      >
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 flex items-center justify-between h-[64px] sm:h-[72px]">
          <Link
            href="/"
            aria-label="Bin or Deal — home"
            className="inline-flex items-baseline gap-3"
            onClick={() => setIsOpen(false)}
          >
            <Logo size={compact ? "sm" : "md"} />
            <span className="hidden lg:inline font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
              EU · marketplace aggregator
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 font-mono text-[11px] uppercase tracking-widest font-bold">
            <NavLink href="/search?v=pokemon">Pokémon</NavLink>
            <NavLink href="/search?v=coins">Monete</NavLink>
            <NavLink href="/search?v=games">Games</NavLink>
            <NavLink href="/search?v=shoes">Shoes</NavLink>
            
            {isLoaded && !userId && (
              <SignInButton mode="modal">
                <button className="bg-ink text-paper px-4 py-2 hover:bg-deal transition-all active:translate-y-0.5">
                  Accedi
                </button>
              </SignInButton>
            )}
            {isLoaded && userId && (
              <div className="flex items-center gap-6">
                <Link href="/#pricing" className="text-ink-muted hover:text-ink transition-colors">Piani</Link>
                <div className="size-8 rounded-full border-2 border-ink overflow-hidden">
                  <UserButton 
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "size-full rounded-none",
                        userButtonTrigger: "size-full rounded-none",
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </nav>

          {/* Mobile Toggle */}
          <button
            type="button"
            className="md:hidden p-2 -mr-2 text-ink z-50"
            onClick={() => setIsOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={32} />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[999] bg-paper flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between h-[64px] px-5 border-b-2 border-ink">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-baseline gap-3"
            >
              <Logo size={compact ? "sm" : "md"} />
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 -mr-2 text-ink"
              aria-label="Close menu"
            >
              <X size={32} />
            </button>
          </div>

          <div className="flex flex-col flex-1 p-6 sm:p-8 overflow-y-auto">
            {/* User status in mobile menu */}
            {isLoaded && (
              <div className="mb-10 p-4 border-2 border-ink bg-surface flex items-center justify-between">
                {!userId ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">Bentornato</span>
                      <span className="display text-xl font-bold">Ospite</span>
                    </div>
                    <SignInButton mode="modal">
                      <button className="bg-ink text-paper px-4 py-2 font-mono text-[10px] uppercase tracking-widest font-bold">
                        Accedi
                      </button>
                    </SignInButton>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">Account</span>
                      <span className="display text-xl font-bold">Attivo</span>
                    </div>
                    <UserButton />
                  </>
                )}
              </div>
            )}

            <nav className="flex flex-col gap-6">
              <MobileLink
                href="/search?v=pokemon"
                label="Pokémon"
                sub="Carte & Box"
                onClick={() => setIsOpen(false)}
              />
              <MobileLink
                href="/search?v=coins"
                label="Monete"
                sub="Euro & Antiche"
                onClick={() => setIsOpen(false)}
              />
              <MobileLink
                href="/search?v=games"
                label="Videogiochi"
                sub="Console & Retro"
                onClick={() => setIsOpen(false)}
              />
              <MobileLink
                href="/search?v=shoes"
                label="Sneakers"
                sub="Streetwear"
                onClick={() => setIsOpen(false)}
              />
            </nav>

            <div className="mt-auto pt-8 border-t-2 border-line">
              <Link
                href="/#pricing"
                onClick={() => setIsOpen(false)}
                className="w-full bg-deal text-paper py-4 px-6 font-mono font-bold uppercase tracking-widest flex items-center justify-between shadow-[4px_4px_0_var(--deal-deep)]"
              >
                <span>Abbonati a Pro</span>
                <ArrowRight size={18} />
              </Link>
              
              <div className="mt-6 grid grid-cols-2 gap-4 text-[11px] font-mono uppercase tracking-widest text-ink-muted">
                <Link href="/#how" onClick={() => setIsOpen(false)}>Come funziona</Link>
                <Link href="/#legal" onClick={() => setIsOpen(false)}>Legale</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="relative group py-2">
      <span className="relative z-10 hover:text-deal transition-colors duration-200">
        {children}
      </span>
      <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-deal transition-all duration-300 group-hover:w-full" />
    </Link>
  )
}

function MobileLink({
  href,
  label,
  sub,
  onClick,
}: {
  href: string
  label: string
  sub: string
  onClick: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex items-center justify-between py-2"
    >
      <div>
        <div className="display text-4xl font-black tracking-tightest group-hover:text-deal transition-colors">
          {label}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
          {sub}
        </div>
      </div>
      <ArrowRight size={24} className="text-line group-hover:text-ink transition-colors" />
    </Link>
  )
}
