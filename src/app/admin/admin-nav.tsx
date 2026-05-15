"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, LayoutDashboard, Users, Search, ArrowLeft, Bell } from "lucide-react"
import { cn } from "@/lib/cn"

interface AdminNavProps {
  userEmail: string
}

export function AdminNav({ userEmail }: AdminNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Scroll Lock when menu is open
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

  const links = [
    { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { href: "/admin/users", label: "Tabella Utenti", icon: <Users size={16} /> },
    { href: "/admin/searches", label: "Tabella Ricerche", icon: <Search size={16} /> },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 border-b-2 border-ink bg-ink text-paper">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 flex items-center justify-between h-[60px]">
          <div className="flex items-center gap-8">
            <Link
              href="/admin"
              className="display text-lg font-black tracking-tightest flex items-center gap-2"
            >
              <span>BinOrDeal</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] font-normal px-1.5 py-0.5 border border-paper/30 text-paper/60 rounded">
                Admin
              </span>
            </Link>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 transition-colors flex items-center gap-2",
                    pathname === link.href 
                      ? "bg-paper text-ink font-bold" 
                      : "text-paper/60 hover:text-paper hover:bg-paper/10"
                  )}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="font-mono text-[9px] uppercase tracking-widest text-paper/40 leading-none mb-1">Sessione come</span>
              <span className="font-mono text-[11px] font-bold text-paper/80 tabular">{userEmail}</span>
            </div>
            
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-paper/50 hover:text-paper transition-colors group"
            >
              <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
              Sito
            </Link>

            {/* Mobile Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 -mr-2 text-paper"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[49] md:hidden bg-ink pt-[60px] animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col h-full p-6 overflow-y-auto">
            <div className="space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/40 mb-4 px-4">Menu Amministrazione</div>
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-4 p-4 font-mono text-sm uppercase tracking-[0.2em] transition-all border-2",
                  pathname === "/admin"
                    ? "bg-paper text-ink font-black border-paper shadow-[4px_4px_0_var(--deal)]"
                    : "text-paper border-transparent hover:bg-paper/10"
                )}
              >
                <LayoutDashboard size={18} className={pathname === "/admin" ? "text-deal" : "text-paper/60"} />
                Dashboard
              </Link>
            </div>

            <div className="mt-8 space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/40 mb-4 px-4">Tabelle Dati</div>
              <Link
                href="/admin/users"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-4 p-4 font-mono text-sm uppercase tracking-[0.2em] transition-all border-2",
                  pathname === "/admin/users"
                    ? "bg-paper text-ink font-black border-paper shadow-[4px_4px_0_var(--deal)]"
                    : "text-paper border-transparent hover:bg-paper/10"
                )}
              >
                <Users size={18} className={pathname === "/admin/users" ? "text-deal" : "text-paper/60"} />
                Tabella Utenti
              </Link>
              <Link
                href="/admin/searches"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-4 p-4 font-mono text-sm uppercase tracking-[0.2em] transition-all border-2",
                  pathname === "/admin/searches"
                    ? "bg-paper text-ink font-black border-paper shadow-[4px_4px_0_var(--deal)]"
                    : "text-paper border-transparent hover:bg-paper/10"
                )}
              >
                <Search size={18} className={pathname === "/admin/searches" ? "text-deal" : "text-paper/60"} />
                Tabella Ricerche
              </Link>
            </div>

            <div className="mt-8 space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/40 mb-4 px-4">Account Utente</div>
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 p-4 font-mono text-sm uppercase tracking-[0.2em] text-paper hover:bg-paper/10 transition-all border-2 border-transparent"
              >
                <LayoutDashboard size={18} className="text-paper/60" />
                La tua Dashboard
              </Link>
              <Link
                href="/dashboard/alerts"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 p-4 font-mono text-sm uppercase tracking-[0.2em] text-paper hover:bg-paper/10 transition-all border-2 border-transparent"
              >
                <Bell size={18} className="text-paper/60" />
                I tuoi Alert
              </Link>
            </div>
            
            <div className="mt-auto pb-12 pt-8 border-t border-paper/10">
              <div className="px-4 mb-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/40 mb-1">Sessione attiva</div>
                <div className="font-mono text-[13px] text-paper font-bold truncate">{userEmail}</div>
              </div>
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-3 w-full py-5 bg-paper text-ink font-mono text-[11px] uppercase tracking-[0.3em] font-black hover:bg-deal transition-all shadow-[6px_6px_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
              >
                <ArrowLeft size={16} />
                Esci dall'Admin
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
