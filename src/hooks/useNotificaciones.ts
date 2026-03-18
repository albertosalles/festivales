'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
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
 *
 * Mantiene un registro interno del último estado conocido de cada barra
 * para detectar transiciones sin depender de payload.old (que requiere
 * REPLICA IDENTITY FULL en la tabla).
 */
export function useNotificaciones() {
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [noLeidas, setNoLeidas] = useState(0);
    const [activas, setActivas] = useState(true);
    const activasRef = useRef(true);

    // Cargar preferencia guardada del usuario
    useEffect(() => {
        const guardado = localStorage.getItem('prefiereNotificaciones');
        if (guardado !== null) {
            const esActiva = guardado === 'true';
            setActivas(esActiva);
            activasRef.current = esActiva;
        }
    }, []);

    const alternarNotificaciones = () => {
        const nuevoEstado = !activas;
        setActivas(nuevoEstado);
        activasRef.current = nuevoEstado;
        localStorage.setItem('prefiereNotificaciones', String(nuevoEstado));
    };

    // Registro del último estado conocido de cada barra (por id_barra)
    const estadosAnteriores = useRef<Map<number, string>>(new Map());

    useEffect(() => {
        const supabase = crearClienteNavegador();

        // Cargar estados iniciales de las barras para tener un punto de referencia
        const cargarEstadosIniciales = async () => {
            const { data } = await supabase
                .from('barras')
                .select('id_barra, estado_cola');

            if (data) {
                data.forEach((fila: { id_barra: number; estado_cola: string }) => {
                    estadosAnteriores.current.set(fila.id_barra, fila.estado_cola);
                });
            }
        };

        cargarEstadosIniciales();

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

                    const estadoAnterior = estadosAnteriores.current.get(nueva.id_barra);

                    // Actualizar el registro con el nuevo estado
                    estadosAnteriores.current.set(nueva.id_barra, nueva.estado_cola);

                    // Solo notificar cuando cambia a 'baja' desde otro estado y están activas
                    if (
                        activasRef.current &&
                        nueva.estado_cola === 'baja' &&
                        estadoAnterior !== undefined &&
                        estadoAnterior !== 'baja'
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
                        toast.success(
                            `🟢 ${nueva.nombre_localizacion} tiene poca cola`,
                            { description: '¡Buen momento para ir!' }
                        );
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
        activas,
        alternarNotificaciones,
        marcarComoLeida,
        marcarTodasComoLeidas,
    };
}
