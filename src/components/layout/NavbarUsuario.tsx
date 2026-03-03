'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RUTAS, NOMBRE_FESTIVAL } from '@/lib/constantes';
import { cn } from '@/lib/utils';

const ENLACES_NAVEGACION = [
    { href: RUTAS.MAPA, etiqueta: 'Mapa', icono: '🗺️' },
    { href: RUTAS.BILLETERA, etiqueta: 'Billetera', icono: '💰' },
    { href: RUTAS.NOTIFICACIONES, etiqueta: 'Avisos', icono: '🔔' },
];

/**
 * Barra de navegación inferior para la vista de usuario (mobile-first).
 */
export function NavbarUsuario() {
    const rutaActual = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-16 max-w-md items-center justify-around px-4">
                {ENLACES_NAVEGACION.map((enlace) => {
                    const estaActivo = rutaActual === enlace.href;
                    return (
                        <Link
                            key={enlace.href}
                            href={enlace.href}
                            className={cn(
                                'flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                                estaActivo
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <span className="text-xl">{enlace.icono}</span>
                            <span>{enlace.etiqueta}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
