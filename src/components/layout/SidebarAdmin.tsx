'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RUTAS } from '@/lib/constantes';
import { cn } from '@/lib/utils';

const ENLACES_ADMIN = [
    { href: RUTAS.ADMIN_DASHBOARD, etiqueta: 'Dashboard', icono: 'dashboard' },
    { href: RUTAS.ADMIN_BARRAS, etiqueta: 'Control de Barras', icono: 'local_bar' },
    { href: RUTAS.ADMIN_CAMAREROS, etiqueta: 'Gestión de Camareros', icono: 'group' },
    { href: RUTAS.ADMIN_FESTIVALES, etiqueta: 'Festivales', icono: 'event' },
    { href: RUTAS.ADMIN_MANTENIMIENTO, etiqueta: 'Panel de Mantenimiento', icono: 'database' },
];

interface SidebarAdminProps {
    colapsado: boolean;
    onToggle: () => void;
}

/**
 * Sidebar de navegación para el panel de administración.
 * Soporta modo colapsado (solo iconos) y expandido. Diseño Stitch "Electric Nocturne".
 */
export function SidebarAdmin({ colapsado, onToggle }: SidebarAdminProps) {
    const rutaActual = usePathname();

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 z-40 flex h-full flex-col border-r border-white/5 bg-[#0e0e11] transition-[width] duration-300 ease-out',
                colapsado ? 'w-20' : 'w-64'
            )}
        >
            {/* Logo + toggle */}
            <div className={cn('p-6 flex items-center', colapsado ? 'justify-center' : 'justify-between')}>
                {colapsado ? (
                    <div
                        className="w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center"
                        title="FESTIAPP Admin"
                    >
                        <span className="text-xl font-black italic text-neon-green tracking-tighter font-headline">
                            F
                        </span>
                    </div>
                ) : (
                    <div>
                        <h1 className="text-2xl font-black italic text-neon-green tracking-tighter font-headline">
                            FESTIAPP
                        </h1>
                        <p className="font-headline tracking-tight text-[10px] uppercase font-bold text-on-surface-variant mt-1">
                            Admin Portal
                        </p>
                    </div>
                )}
            </div>

            {/* Botón toggle */}
            <button
                onClick={onToggle}
                title={colapsado ? 'Expandir panel' : 'Colapsar panel'}
                className={cn(
                    'absolute top-6 -right-3 w-6 h-6 rounded-full bg-surface-container-high border border-white/10 text-on-surface-variant hover:text-neon-green hover:bg-neon-green/10 flex items-center justify-center transition-all z-10 shadow-md'
                )}
            >
                <span className="material-symbols-outlined text-xs">
                    {colapsado ? 'chevron_right' : 'chevron_left'}
                </span>
            </button>

            {/* Navegación */}
            <nav className={cn('flex-1 space-y-2', colapsado ? 'px-3' : 'px-4')}>
                {ENLACES_ADMIN.map((enlace) => {
                    const estaActivo = rutaActual?.startsWith(enlace.href);
                    return (
                        <Link
                            key={enlace.href}
                            href={enlace.href}
                            title={colapsado ? enlace.etiqueta : undefined}
                            className={cn(
                                'flex items-center font-headline tracking-tight text-sm uppercase font-bold transition-all duration-200 rounded-lg',
                                colapsado ? 'justify-center w-14 h-14 mx-auto' : 'gap-3 px-4 py-3',
                                estaActivo
                                    ? colapsado
                                        ? 'text-neon-green bg-neon-green/10 border border-neon-green/40'
                                        : 'text-neon-green bg-neon-green/10 border-l-4 border-neon-green'
                                    : 'text-on-surface-variant hover:text-neon-green hover:bg-white/5'
                            )}
                        >
                            <span className="material-symbols-outlined">{enlace.icono}</span>
                            {!colapsado && enlace.etiqueta}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className={cn('border-t border-white/5', colapsado ? 'p-4' : 'p-6')}>
                <Link
                    href={RUTAS.LOGIN}
                    title={colapsado ? 'Cerrar sesión' : undefined}
                    className={cn(
                        'flex items-center text-on-surface-variant hover:text-neon-green transition-colors text-sm font-medium',
                        colapsado ? 'justify-center' : 'gap-3'
                    )}
                >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    {!colapsado && 'Cerrar sesión'}
                </Link>
            </div>
        </aside>
    );
}
