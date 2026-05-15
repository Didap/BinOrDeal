"use client"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X, ArrowRight, User, Bell, LogOut, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/cn"
import { getUserRole } from "@/app/auth/actions"
import { UpgradeButton } from "@/components/upgrade-button"

interface Props {
  className?: string
  compact?: boolean
}

export function Nav({ className, compact }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkAdmin = async (u: any) => {
      if (!u) {
        setIsAdmin(false)
        return
      }
      
      const metaRole = u.app_metadata?.role || u.user_metadata?.role
      if (metaRole === "admin") {
        setIsAdmin(true)
        return
      }

      try {
        const role = await getUserRole()
        setIsAdmin(role === "admin")
      } catch (err) {
        setIsAdmin(false)
      }
    }

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoaded(true)
      await checkAdmin(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      setIsLoaded(true)
      await checkAdmin(u)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignIn = () => {
    window.location.href = "/login"
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(".user-menu-container")) {
        setIsUserMenuOpen(false)
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isUserMenuOpen])

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

          <nav className="hidden md:flex items-center gap-8 font-mono text-[11px] uppercase tracking-widest font-bold">
            <NavLink href="/search?v=pokemon">Pokémon</NavLink>
            <NavLink href="/search?v=coins">Monete</NavLink>
            <NavLink href="/search?v=games">Games</NavLink>
            <NavLink href="/search?v=shoes">Shoes</NavLink>
            
            {isLoaded && !user && (
              <button 
                onClick={handleSignIn}
                className="bg-ink text-paper px-4 py-2 hover:bg-deal transition-all active:translate-y-0.5"
              >
                Accedi
              </button>
            )}
            {isLoaded && user && (
              <div className="flex items-center gap-6">
                <Link href="/#pricing" className="text-ink-muted hover:text-ink transition-colors">Piani</Link>
                {isAdmin && (
                  <Link 
                    href="/admin" 
                    className="border-2 border-ink px-3 py-1.5 hover:bg-ink hover:text-paper transition-all text-[10px] font-bold"
                  >
                    Dashboard
                  </Link>
                )}
                <div className="relative user-menu-container">
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={cn(
                      "size-8 rounded-full border-2 border-ink overflow-hidden bg-surface flex items-center justify-center hover:bg-paper-deep transition-colors",
                      isUserMenuOpen && "bg-paper-deep ring-2 ring-deal ring-offset-2 ring-offset-paper"
                    )}
                    title="Menu utente"
                  >
                    {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="User" className="size-full object-cover" />
                    ) : (
                      <User size={16} />
                    )}
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-3 w-48 bg-paper border-2 border-ink shadow-[4px_4px_0_var(--ink)] py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-2 border-b-2 border-line mb-2">
                        <p className="font-mono text-[9px] uppercase tracking-widest text-ink-muted truncate">
                          {user.email}
                        </p>
                      </div>
                      
                      <Link 
                        href="/dashboard/profile" 
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-deal/10 font-mono text-[10px] uppercase tracking-widest font-bold transition-colors"
                      >
                        <User size={14} className="text-ink-muted" />
                        Profilo
                      </Link>

                      <Link 
                        href="/dashboard/alerts" 
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-deal/10 font-mono text-[10px] uppercase tracking-widest font-bold transition-colors"
                      >
                        <Bell size={14} className="text-ink-muted" />
                        I Miei Alert
                      </Link>

                      <div className="h-[2px] bg-line my-2" />

                      <button 
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-hot/10 text-hot font-mono text-[10px] uppercase tracking-widest font-bold transition-colors text-left"
                      >
                        <LogOut size={14} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </nav>

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
            {isLoaded && (
              <div className="mb-10 p-4 border-2 border-ink bg-surface flex items-center justify-between">
                {!user ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">Bentornato</span>
                      <span className="display text-xl font-bold">Ospite</span>
                    </div>
                    <button 
                      onClick={handleSignIn}
                      className="bg-ink text-paper px-4 py-2 font-mono text-[10px] uppercase tracking-widest font-bold"
                    >
                      Accedi
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">Account</span>
                      <span className="display text-xl font-bold">Attivo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <Link 
                          href="/admin"
                          onClick={() => setIsOpen(false)}
                          className="bg-ink text-paper px-3 py-2 font-mono text-[10px] uppercase tracking-widest font-bold"
                        >
                          Dashboard
                        </Link>
                      )}
                      <button 
                        onClick={handleSignOut}
                        className="p-2 border-2 border-ink hover:bg-paper-deep transition-colors font-mono text-[10px] uppercase font-bold"
                      >
                        Logout
                      </button>
                    </div>
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
              <UpgradeButton 
                label="Abbonati a Pro"
                className="w-full py-4 px-6 shadow-[4px_4px_0_var(--deal-deep)]"
              />
              
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
