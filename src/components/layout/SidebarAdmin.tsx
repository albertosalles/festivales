'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RUTAS } from '@/lib/constantes';
import { cn } from '@/lib/utils';

const ENLACES_ADMIN = [
    { href: RUTAS.ADMIN_DASHBOARD, etiqueta: 'Dashboard', icono: 'dashboard' },
    { href: RUTAS.ADMIN_BARRAS, etiqueta: 'Control de Barras', icono: 'local_bar' },
    { href: RUTAS.ADMIN_CAMAREROS, etiqueta: 'Gestión de Camareros', icono: 'group' },
];

/**
 * Sidebar de navegación para el panel de administración.
 * Diseño Stitch "Electric Nocturne" con neon accents.
 */
export function SidebarAdmin() {
    const rutaActual = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-white/5 bg-[#0e0e11]">
            {/* Logo */}
            <div className="p-8">
                <h1 className="text-2xl font-black italic text-neon-green tracking-tighter font-headline">
                    FESTIAPP
                </h1>
                <p className="font-headline tracking-tight text-[10px] uppercase font-bold text-on-surface-variant mt-1">
                    Admin Portal
                </p>
            </div>

            {/* Navegación */}
            <nav className="flex-1 px-4 space-y-2">
                {ENLACES_ADMIN.map((enlace) => {
                    const estaActivo = rutaActual?.startsWith(enlace.href);
                    return (
                        <Link
                            key={enlace.href}
                            href={enlace.href}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 font-headline tracking-tight text-sm uppercase font-bold transition-all duration-200 rounded-lg',
                                estaActivo
                                    ? 'text-neon-green bg-neon-green/10 border-l-4 border-neon-green'
                                    : 'text-on-surface-variant hover:text-neon-green hover:bg-white/5'
                            )}
                        >
                            <span className="material-symbols-outlined">{enlace.icono}</span>
                            {enlace.etiqueta}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-white/5">
                <Link
                    href={RUTAS.LOGIN}
                    className="flex items-center gap-3 text-on-surface-variant hover:text-neon-green transition-colors text-sm font-medium"
                >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    Cerrar sesión
                </Link>
            </div>
        </aside>
    );
}
