import { useEffect, useState, useCallback } from 'react'

interface PortfolioPromoModalProps {
  imageUrl: string
}

const STORAGE_KEY = 'kerux-promo-dismissed-at'
const SHOW_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000

function shouldShow(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return true
    const dismissed = new Date(stored).getTime()
    if (isNaN(dismissed)) {
      localStorage.removeItem(STORAGE_KEY)
      return true
    }
    return Date.now() - dismissed >= SHOW_INTERVAL_MS
  } catch {
    return true
  }
}

function markDismissed() {
  localStorage.setItem(STORAGE_KEY, new Date().toISOString())
}

export function PortfolioPromoModal({ imageUrl }: PortfolioPromoModalProps) {
  const [open, setOpen] = useState(false)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    const show = shouldShow()
    if (show) {
      const timer = setTimeout(() => setOpen(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const dismiss = useCallback(() => {
    markDismissed()
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, dismiss])

  function openPortfolio() {
    window.open('https://jobs.ptrianda.com', '_blank')
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-2"
      style={{ backgroundColor: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)' }}
      onClick={dismiss}
    >
      <div
        className="animate-scale-in flex max-h-[95dvh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ maxWidth: '900px', width: '95%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <button
            onClick={dismiss}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/50"
            aria-label="Cerrar"
          >
            ✕
          </button>
          <button
            onClick={openPortfolio}
            className="block w-full cursor-pointer"
            aria-label="Abrir portfolio"
          >
            {imgError ? (
              <div className="flex h-48 items-center justify-center bg-gradient-to-br from-primary-start to-primary-end">
                <span className="text-4xl">🚀</span>
              </div>
            ) : (
              <img
                src={imageUrl}
                alt="Kerux — Conocé nuestros desarrollos"
                className="w-full object-contain"
                onError={() => setImgError(true)}
              />
            )}
          </button>
        </div>

        <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
          <h2 className="text-center text-lg font-bold text-text-primary">
            Conocé nuestros desarrollos
          </h2>
          <p className="mt-1 text-center text-sm text-text-secondary">
            Explorá proyectos, sistemas y soluciones desarrolladas por Kerux.
          </p>

          <div className="mt-auto pt-5">
            <button
              onClick={openPortfolio}
              className="flex w-full items-center justify-center gap-2 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{
                height: '52px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6C63FF, #8B7FFF)',
              }}
            >
              🚀 Ver portfolio completo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}