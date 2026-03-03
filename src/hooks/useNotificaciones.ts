'use client';

import { useEffect, useState } from 'react';
import { crearClienteNavegador } from '@/lib/supabase/cliente';

/** Estructura de una notificación in-app */
export interface Notificacion {
    id: string;
    mensaje: string;
    nombreBarra: string;
    fecha: Date;
    leida: boolean;
}

/**
 * Hook que escucha cambios en las barras y genera notificaciones
 * cuando una barra pasa a estado 'baja' (poca cola).
 */
export function useNotificaciones() {
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [noLeidas, setNoLeidas] = useState(0);

    useEffect(() => {
        const supabase = crearClienteNavegador();

        const canal = supabase
            .channel('notificaciones-colas')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'barras',
                },
                (payload) => {
                    const nueva = payload.new as {
                        id_barra: number;
                        nombre_localizacion: string;
                        estado_cola: string;
                    };
                    const anterior = payload.old as {
                        estado_cola?: string;
                    };

                    // Solo notificar cuando cambia a 'baja' desde otro estado
                    if (
                        nueva.estado_cola === 'baja' &&
                        anterior.estado_cola !== 'baja'
                    ) {
                        const notificacion: Notificacion = {
                            id: `${nueva.id_barra}-${Date.now()}`,
                            mensaje: `¡${nueva.nombre_localizacion} tiene poca cola! Buen momento para ir.`,
                            nombreBarra: nueva.nombre_localizacion,
                            fecha: new Date(),
                            leida: false,
                        };

                        setNotificaciones((prev) => [notificacion, ...prev]);
                        setNoLeidas((prev) => prev + 1);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(canal);
        };
    }, []);

    /** Marca una notificación como leída */
    const marcarComoLeida = (idNotificacion: string) => {
        setNotificaciones((prev) =>
            prev.map((n) =>
                n.id === idNotificacion ? { ...n, leida: true } : n
            )
        );
        setNoLeidas((prev) => Math.max(0, prev - 1));
    };

    /** Marca todas las notificaciones como leídas */
    const marcarTodasComoLeidas = () => {
        setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
        setNoLeidas(0);
    };

    return {
        notificaciones,
        noLeidas,
        marcarComoLeida,
        marcarTodasComoLeidas,
    };
}
