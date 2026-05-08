'use client';

import { useEffect, useState } from 'react';
import { crearClienteNavegador } from '@/lib/supabase/cliente';
import type { Incidencia } from '@/lib/tipos';

/**
 * Mantiene la lista de incidencias pendientes actualizada en tiempo real
 * mediante Supabase Realtime, escuchando INSERT y UPDATE en incidencias_barra.
 */
export function useIncidenciasEnTiempoReal(iniciales: Incidencia[]): Incidencia[] {
    const [incidencias, setIncidencias] = useState<Incidencia[]>(iniciales);

    useEffect(() => {
        setIncidencias(iniciales);
    }, [iniciales]);

    useEffect(() => {
        const supabase = crearClienteNavegador();

        const canal = supabase
            .channel('incidencias-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'incidencias_barra' },
                (payload) => {
                    const fila = payload.new as {
                        id_incidencia: number;
                        id_barra: number;
                        id_camarero: number;
                        tipo_incidencia: string;
                        descripcion?: string;
                        fecha_reporte: string;
                        estado: string;
                    };
                    if (fila.estado === 'pendiente') {
                        setIncidencias((prev) => [
                            {
                                idIncidencia: fila.id_incidencia,
                                idBarra: fila.id_barra,
                                idCamarero: fila.id_camarero,
                                tipoIncidencia: fila.tipo_incidencia,
                                descripcion: fila.descripcion,
                                fechaReporte: fila.fecha_reporte,
                                estado: 'pendiente',
                            },
                            ...prev,
                        ]);
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'incidencias_barra' },
                (payload) => {
                    const fila = payload.new as { id_incidencia: number; estado: string };
                    setIncidencias((prev) =>
                        prev
                            .map((i) =>
                                i.idIncidencia === fila.id_incidencia
                                    ? { ...i, estado: fila.estado as 'pendiente' | 'resuelta' }
                                    : i
                            )
                            .filter((i) => i.estado === 'pendiente')
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(canal);
        };
    }, []);

    return incidencias;
}
