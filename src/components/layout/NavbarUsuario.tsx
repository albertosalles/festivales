'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RUTAS } from '@/lib/constantes';
import { cn } from '@/lib/utils';
import { useContextoNotificaciones } from '@/components/notificaciones/ProveedorNotificaciones';

const ENLACES_NAVEGACION = [
    { href: RUTAS.MAPA, etiqueta: 'Mapa', icono: '🗺️' },
    { href: RUTAS.BILLETERA, etiqueta: 'Billetera', icono: '💰' },
    { href: RUTAS.NOTIFICACIONES, etiqueta: 'Avisos', icono: '🔔' },
];

/**
 * Barra de navegación inferior para la vista de usuario (mobile-first).
 * Muestra un badge con el contador de notificaciones no leídas.
 */
export function NavbarUsuario() {
    const rutaActual = usePathname();
    const { noLeidas } = useContextoNotificaciones();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-16 max-w-md items-center justify-around px-4">
                {ENLACES_NAVEGACION.map((enlace) => {
                    const estaActivo = rutaActual === enlace.href;
                    const esNotificaciones = enlace.href === RUTAS.NOTIFICACIONES;

                    return (
                        <Link
                            key={enlace.href}
                            href={enlace.href}
                            className={cn(
                                'relative flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                                estaActivo
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <span className="relative text-xl">
                                {enlace.icono}
                                {esNotificaciones && noLeidas > 0 && (
                                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                        {noLeidas > 9 ? '9+' : noLeidas}
                                    </span>
                                )}
                            </span>
                            <span>{enlace.etiqueta}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
