import { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true)
      return
    }

    function handler(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setDeferredPrompt(null))

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  if (isStandalone || dismissed) return null

  const ios = isIOS()

  if (!ios && !deferredPrompt) return null

  return (
    <div className="mb-3 animate-slide-up rounded-xl bg-gradient-to-r from-primary-start to-primary-end p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
          {ios ? <Smartphone className="h-5 w-5 text-white" /> : <Download className="h-5 w-5 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Instalar MisCuentas</p>
          {ios ? (
            <p className="text-xs text-white/80">Desde Safari: Compartir → Agregar a pantalla de inicio</p>
          ) : (
            <p className="text-xs text-white/80 truncate">Acceso rápido desde tu pantalla de inicio</p>
          )}
        </div>
        {!ios && (
          <button
            onClick={handleInstall}
            className="shrink-0 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-sm transition-opacity hover:opacity-90"
          >
            Instalar
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-full p-1 text-white/70 hover:text-white"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
