'use client';

import { ListaNotificaciones } from '@/components/notificaciones/ListaNotificaciones';
import { useContextoNotificaciones } from '@/components/notificaciones/ProveedorNotificaciones';

/**
 * Página de alertas del festival — Diseño Stitch "Electric Nocturne".
 * Historial de alertas de cola baja, artistas y transacciones.
 */
export default function PaginaNotificaciones() {
    const { activas, alternarNotificaciones } = useContextoNotificaciones();

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header Section */}
            <header className="mb-10">
                <div className="flex items-baseline gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-neon-green/10 text-neon-green text-[10px] font-bold tracking-[0.2em] uppercase rounded">
                        Live Updates
                    </span>
                </div>
                <h1 className="text-5xl font-black font-headline tracking-tighter text-on-surface uppercase mb-2">
                    Alertas
                </h1>
                <p className="text-on-surface-variant font-medium">
                    Pulsos en tiempo real desde el recinto del festival.
                </p>
            </header>

            {/* Toggle notificaciones */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={alternarNotificaciones}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
                        activas
                            ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                            : 'bg-surface-container text-on-surface-variant border border-outline-variant/10'
                    }`}
                >
                    <span
                        className="material-symbols-outlined text-sm"
                        style={activas ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                        {activas ? 'notifications_active' : 'notifications_off'}
                    </span>
                    {activas ? 'Activadas' : 'Desactivadas'}
                </button>
            </div>

            <ListaNotificaciones />
        </div>
    );
}
