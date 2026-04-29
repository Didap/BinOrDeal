"use client"
import { useEffect } from "react"

interface Props {
  theme: string
}

/**
 * Applies `data-theme` to <html>, driving the per-vertical palette in
 * globals.css. Runs on mount and whenever `theme` changes, so switching
 * verticals inside /search produces the 450ms color transition defined
 * on html/body. When unmounted (e.g. navigating back to landing) it
 * clears the attribute so the default palette returns.
 */
export function ThemeSwitch({ theme }: Props) {
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute("data-theme", theme)
    return () => {
      root.removeAttribute("data-theme")
    }
  }, [theme])
  return null
}
