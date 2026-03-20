'use client';

import { useBarrasEnTiempoReal } from '@/hooks/useBarrasEnTiempoReal';
import { TarjetaBarra } from './TarjetaBarra';
import type { Barra } from '@/lib/tipos';

interface GridBarrasProps {
    barrasIniciales: Barra[];
}

/**
 * Grid responsivo Bento de tarjetas de barras.
 * Se actualiza en tiempo real gracias al hook useBarrasEnTiempoReal.
 */
export function GridBarras({ barrasIniciales }: GridBarrasProps) {
    const barras = useBarrasEnTiempoReal(barrasIniciales);

    if (barras.length === 0) {
        return (
            <div className="glass-card rounded-[2rem] p-12 text-center border border-outline-variant/10">
                <span className="material-symbols-outlined text-on-surface-variant text-6xl mb-4">
                    local_bar
                </span>
                <p className="mt-4 text-lg font-headline font-bold text-on-surface uppercase tracking-tight">
                    No hay barras registradas
                </p>
                <p className="text-sm text-on-surface-variant mt-2">
                    Las barras aparecerán aquí cuando la organización las configure.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {barras.map((barra) => (
                <TarjetaBarra key={barra.idBarra} barra={barra} />
            ))}
        </div>
    );
}
