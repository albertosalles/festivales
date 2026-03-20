'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RUTAS, NOMBRE_FESTIVAL } from '@/lib/constantes';
import { cn } from '@/lib/utils';

const ENLACES_ADMIN = [
    { href: RUTAS.ADMIN_MAPA, etiqueta: 'Mapa de Barras', icono: 'map' },
    { href: RUTAS.ADMIN_DASHBOARD, etiqueta: 'Dashboard', icono: 'analytics' },
    { href: RUTAS.ADMIN_BARRAS, etiqueta: 'Gestión Barras', icono: 'local_bar' },
];

/**
 * Sidebar de navegación para el panel de administración.
 * Diseño Stitch "Electric Nocturne" con iconos Material Symbols.
 */
export function SidebarAdmin() {
    const rutaActual = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col bg-surface-container-lowest border-r border-outline-variant/10">
            {/* Logo / Título */}
            <div className="flex h-20 items-center px-6 border-b border-outline-variant/10">
                <div className="flex flex-col">
                    <span className="text-xl font-black text-neon-green tracking-tighter font-headline uppercase">
                        {NOMBRE_FESTIVAL}
                    </span>
                    <span className="text-[10px] font-label-text font-bold uppercase tracking-[0.2em] text-neon-orange">
                        Admin Panel
                    </span>
                </div>
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
                                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                                estaActivo
                                    ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                            )}
                        >
                            <span
                                className="material-symbols-outlined text-xl"
                                style={estaActivo ? { fontVariationSettings: "'FILL' 1" } : undefined}
                            >
                                {enlace.icono}
                            </span>
                            <span className="font-label-text font-bold">{enlace.etiqueta}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="border-t border-outline-variant/10 p-4">
                <Link
                    href={RUTAS.LOGIN}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-on-surface-variant hover:text-error hover:bg-error/10 transition-all"
                >
                    <span className="material-symbols-outlined text-xl">logout</span>
                    <span className="font-label-text font-bold">Cerrar sesión</span>
                </Link>
            </div>
        </aside>
    );
}
