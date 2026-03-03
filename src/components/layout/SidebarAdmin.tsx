'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RUTAS } from '@/lib/constantes';
import { cn } from '@/lib/utils';

const ENLACES_ADMIN = [
    { href: RUTAS.ADMIN_DASHBOARD, etiqueta: 'Dashboard', icono: '📊' },
    { href: RUTAS.ADMIN_BARRAS, etiqueta: 'Barras', icono: '🍺' },
];

/**
 * Sidebar de navegación para el panel de administración.
 */
export function SidebarAdmin() {
    const rutaActual = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r bg-sidebar">
            {/* Logo / Título */}
            <div className="flex h-16 items-center border-b px-6">
                <h1 className="text-lg font-bold text-sidebar-foreground">
                    🎛️ Panel Admin
                </h1>
            </div>

            {/* Navegación */}
            <nav className="flex-1 space-y-1 p-4">
                {ENLACES_ADMIN.map((enlace) => {
                    const estaActivo = rutaActual === enlace.href;
                    return (
                        <Link
                            key={enlace.href}
                            href={enlace.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                estaActivo
                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                            )}
                        >
                            <span className="text-lg">{enlace.icono}</span>
                            <span>{enlace.etiqueta}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="border-t p-4">
                <Link
                    href={RUTAS.LOGIN}
                    className="flex items-center gap-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground"
                >
                    <span>🚪</span>
                    <span>Cerrar sesión</span>
                </Link>
            </div>
        </aside>
    );
}
