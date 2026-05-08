'use client';

import { usePathname } from 'next/navigation';
import { RUTAS } from '@/lib/constantes';

const TITULOS: Record<string, string> = {
    [RUTAS.ADMIN_DASHBOARD]: 'Global Dashboard',
    [RUTAS.ADMIN_BARRAS]: 'Live Control',
    [RUTAS.ADMIN_CAMAREROS]: 'Gestión de Camareros',
};

interface CabeceraAdminProps {
    colapsado?: boolean;
}

/**
 * Header superior del panel admin — Stitch "Electric Nocturne".
 * Muestra el título contextual y se ajusta al ancho del sidebar.
 */
export function CabeceraAdmin({ colapsado = false }: CabeceraAdminProps) {
    const ruta = usePathname();
    const tituloSeccion = Object.entries(TITULOS).find(([r]) => ruta?.startsWith(r))?.[1] ?? 'Admin';

    return (
        <header
            className={`fixed top-0 right-0 h-16 flex justify-between items-center px-8 z-30 bg-[#0e0e11]/60 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-[left] duration-300 ease-out ${
                colapsado ? 'left-20' : 'left-64'
            }`}
        >
            <div className="flex items-center gap-4">
                <h2 className="font-headline font-black text-xl tracking-tighter text-neon-green">
                    FESTIAPP ADMIN
                </h2>
                <div className="h-4 w-[1px] bg-white/10 mx-2" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-neon-blue">
                    {tituloSeccion}
                </span>
            </div>
        </header>
    );
}
