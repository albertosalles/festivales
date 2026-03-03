'use client';

import { useEffect, useState } from 'react';
import { crearClienteNavegador } from '@/lib/supabase/cliente';
import type { Barra, EstadoCola } from '@/lib/tipos';

/**
 * Hook que mantiene la lista de barras actualizada en tiempo real
 * mediante Supabase Realtime (canal postgres_changes).
 *
 * Recibe las barras cargadas inicialmente en el servidor y se suscribe
 * a cambios UPDATE en la tabla `barras`.
 */
export function useBarrasEnTiempoReal(barrasIniciales: Barra[]): Barra[] {
    const [barras, setBarras] = useState<Barra[]>(barrasIniciales);

    // Sincronizar si las barras iniciales cambian (ej. navegación)
    useEffect(() => {
        setBarras(barrasIniciales);
    }, [barrasIniciales]);

    useEffect(() => {
        const supabase = crearClienteNavegador();

        const canal = supabase
            .channel('barras-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'barras',
                },
                (payload) => {
                    const barraActualizada = payload.new as {
                        id_barra: number;
                        nombre_localizacion: string;
                        estado_cola: string;
                    };

                    setBarras((prev) =>
                        prev.map((barra) =>
                            barra.idBarra === barraActualizada.id_barra
                                ? {
                                    ...barra,
                                    nombreLocalizacion: barraActualizada.nombre_localizacion,
                                    estadoCola: barraActualizada.estado_cola as EstadoCola,
                                }
                                : barra
                        )
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(canal);
        };
    }, []);

    return barras;
}
