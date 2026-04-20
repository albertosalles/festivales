'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { CLAVE_SESION } from '@/lib/constantes';

/**
 * Hook que consulta periódicamente el concierto actual y notifica al usuario
 * si su género de música favorito está sonando.
 *
 * Usa refs para estabilizar la función de polling y evitar que reinicie
 * el intervalo con cada re-render del componente padre.
 */

const INTERVALO_MS = 15_000; // Polling cada 15 segundos

export function useConciertoActual(
    agregarNotificacion: (mensaje: string, nombreBarra: string, icono?: string) => void
) {
    // Guardamos la función en un ref para que siempre use la versión más reciente
    // sin que sea una dependencia del useEffect (evita reiniciar el intervalo)
    const agregarNotificacionRef = useRef(agregarNotificacion);
    useEffect(() => {
        agregarNotificacionRef.current = agregarNotificacion;
    }, [agregarNotificacion]);

    // Refs estables — no provocan re-renders ni recrían el intervalo
    const generoAnterior = useRef<string | null | undefined>(undefined); // undefined = sin inicializar
    const consultando = useRef(false); // evitar solapamiento de peticiones

    useEffect(() => {
        const comprobar = async () => {
            // Evitar peticiones simultáneas
            if (consultando.current) return;
            consultando.current = true;

            try {
                // Leer la sesión del usuario
                const sesionRaw = localStorage.getItem(CLAVE_SESION);
                if (!sesionRaw) return;

                const sesion = JSON.parse(sesionRaw);

                // Los admins no reciben notificaciones de concierto
                if (sesion.rol === 'admin') return;

                // Consultar el género sonando actualmente
                const respConcierto = await fetch('/api/conciertos/estado');
                if (!respConcierto.ok) return;

                const { genero: generoActual } = await respConcierto.json();

                // Primera vez que comprobamos: guardamos el estado base sin notificar
                if (generoAnterior.current === undefined) {
                    generoAnterior.current = generoActual ?? null;
                    return;
                }

                // Si el género no ha cambiado, no hacemos nada
                if (!generoActual || generoActual === generoAnterior.current) return;

                // El género cambió — actualizar referencia ANTES de notificar
                const generoNuevo = generoActual;
                generoAnterior.current = generoNuevo;

                // Consultar las preferencias musicales del usuario
                const respPrefs = await fetch(
                    `/api/auth/preferencias?idUsuario=${sesion.idUsuario}`
                );
                if (!respPrefs.ok) return;

                const { musica } = await respPrefs.json();
                if (!musica) return;

                const generosFavoritos: string[] = musica
                    .split(',')
                    .map((g: string) => g.trim().toLowerCase());

                if (generosFavoritos.includes(generoNuevo.toLowerCase())) {
                    agregarNotificacionRef.current(
                        `🎵 ¡Tu género favorito ${generoNuevo} está sonando ahora!`,
                        'Escenario Principal',
                        'music_note'
                    );
                    toast.success(
                        `🎵 ¡${generoNuevo} está sonando ahora!`,
                        { description: 'Tu artista/género favorito está en el escenario 🎤' }
                    );
                }
            } catch {
                // Silenciar errores de red
            } finally {
                consultando.current = false;
            }
        };

        // Comprobación inicial inmediata
        comprobar();

        // Polling periódico — este useEffect solo se ejecuta UNA vez (deps vacías)
        const intervalo = setInterval(comprobar, INTERVALO_MS);

        return () => {
            clearInterval(intervalo);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Intencionalmente vacío — usamos refs para acceder a valores actualizados
}
