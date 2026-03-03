'use client';

import { useBarrasEnTiempoReal } from '@/hooks/useBarrasEnTiempoReal';
import { TarjetaBarra } from './TarjetaBarra';
import type { Barra } from '@/lib/tipos';

interface GridBarrasProps {
    barrasIniciales: Barra[];
}

/**
 * Grid responsivo que muestra todas las barras del recinto.
 * Se actualiza en tiempo real gracias al hook useBarrasEnTiempoReal.
 */
export function GridBarras({ barrasIniciales }: GridBarrasProps) {
    const barras = useBarrasEnTiempoReal(barrasIniciales);

    if (barras.length === 0) {
        return (
            <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
                <p className="text-4xl">🍺</p>
                <p className="mt-4 text-lg font-medium">No hay barras registradas</p>
                <p className="text-sm">
                    Las barras aparecerán aquí cuando la organización las configure.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {barras.map((barra) => (
                <TarjetaBarra key={barra.idBarra} barra={barra} />
            ))}
        </div>
    );
}
