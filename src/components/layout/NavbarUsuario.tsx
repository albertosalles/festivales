'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RUTAS } from '@/lib/constantes';
import { cn } from '@/lib/utils';
import { useContextoNotificaciones } from '@/components/notificaciones/ProveedorNotificaciones';

/** Enlaces de la barra de navegación inferior */
const ENLACES_NAVEGACION = [
    { href: RUTAS.MAPA, etiqueta: 'Mapa', icono: 'map' },
    { href: RUTAS.BILLETERA, etiqueta: 'Wallet', icono: 'payments' },
    { href: RUTAS.NOTIFICACIONES, etiqueta: 'Alertas', icono: 'notifications' },
];

/**
 * Barra de navegación inferior estilo Stitch "Electric Nocturne".
 * Diseño glassmórfico con iconos Material Symbols y efecto de glow activo.
 */
export function NavbarUsuario() {
    const rutaActual = usePathname();
    const { noLeidas } = useContextoNotificaciones();

    return (
        <nav className="navbar-pwa pwa-touch-safe fixed bottom-0 left-0 w-full z-50 rounded-t-[2rem] bg-[#19191d]/80 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <div className="flex justify-around items-center px-6 pb-6 pt-3 max-w-lg mx-auto">
                {ENLACES_NAVEGACION.map((enlace) => {
                    const estaActivo = rutaActual === enlace.href;
                    const esNotificaciones = enlace.href === RUTAS.NOTIFICACIONES;

                    return (
                        <Link
                            key={enlace.href}
                            href={enlace.href}
                            className={cn(
                                'flex flex-col items-center justify-center active:scale-90 transition-all duration-200',
                                estaActivo
                                    ? 'text-neon-green bg-neon-green/10 rounded-full px-4 py-1 shadow-[0_0_15px_rgba(233,255,186,0.3)]'
                                    : 'text-on-surface-variant hover:text-neon-blue'
                            )}
                        >
                            <div className="relative">
                                <span
                                    className="material-symbols-outlined"
                                    style={
                                        estaActivo
                                            ? { fontVariationSettings: "'FILL' 1" }
                                            : undefined
                                    }
                                >
                                    {enlace.icono}
                                </span>
                                {/* Badge de notificaciones no leídas */}
                                {esNotificaciones && noLeidas > 0 && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full" />
                                )}
                            </div>
                            <span className="font-label-text text-[10px] font-bold uppercase tracking-widest mt-1">
                                {enlace.etiqueta}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
