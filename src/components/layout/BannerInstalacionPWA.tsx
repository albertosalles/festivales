'use client';

import { useEffect, useState } from 'react';

/** Clave en sessionStorage para recordar que el usuario descartó el banner */
const CLAVE_BANNER_DESCARTADO = 'festiapp_pwa_banner_descartado';

/**
 * Detecta si el navegador es iOS Safari y no está en modo standalone.
 * Solo en ese caso muestra un banner con instrucciones para instalar la PWA.
 */
export function BannerInstalacionPWA() {
    const [mostrar, setMostrar] = useState(false);

    useEffect(() => {
        // Verificar si ya fue descartado
        if (sessionStorage.getItem(CLAVE_BANNER_DESCARTADO) === 'true') return;

        // Detectar iOS
        const esIOS =
            /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

        // Detectar si ya está en modo standalone
        const esStandalone =
            ('standalone' in window.navigator &&
                (window.navigator as unknown as { standalone: boolean }).standalone) ||
            window.matchMedia('(display-mode: standalone)').matches;

        // Mostrar solo si es iOS y NO está en standalone
        if (esIOS && !esStandalone) {
            // Esperar un momento para que la animación se vea bien
            const timer = setTimeout(() => setMostrar(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const descartar = () => {
        setMostrar(false);
        sessionStorage.setItem(CLAVE_BANNER_DESCARTADO, 'true');
    };

    if (!mostrar) return null;

    return (
        <div className="animate-slide-up fixed bottom-24 left-4 right-4 z-[60] rounded-2xl border border-white/10 bg-surface-container/95 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.6)] p-4 max-w-md mx-auto">
            <div className="flex items-start gap-3">
                {/* Icono */}
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-neon-green text-xl">
                        install_mobile
                    </span>
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                    <p className="font-headline font-bold text-on-surface text-sm">
                        Instala FestiApp
                    </p>
                    <p className="text-on-surface-variant text-xs mt-0.5 leading-relaxed">
                        Toca{' '}
                        <span className="material-symbols-outlined text-neon-blue text-[14px] align-middle">
                            ios_share
                        </span>{' '}
                        y selecciona{' '}
                        <span className="font-semibold text-on-surface">
                            &quot;Añadir a pantalla de inicio&quot;
                        </span>
                    </p>
                </div>

                {/* Botón cerrar */}
                <button
                    onClick={descartar}
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 active:scale-90 transition-all"
                    aria-label="Cerrar banner de instalación"
                >
                    <span className="material-symbols-outlined text-on-surface-variant text-lg">
                        close
                    </span>
                </button>
            </div>
        </div>
    );
}
