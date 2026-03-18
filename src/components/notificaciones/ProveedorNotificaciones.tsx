'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useNotificaciones, type Notificacion } from '@/hooks/useNotificaciones';

/** Tipo del contexto de notificaciones */
interface ContextoNotificaciones {
    notificaciones: Notificacion[];
    noLeidas: number;
    activas: boolean;
    alternarNotificaciones: () => void;
    marcarComoLeida: (idNotificacion: string) => void;
    marcarTodasComoLeidas: () => void;
}

const ContextoNotificacionesReact = createContext<ContextoNotificaciones | null>(null);

/**
 * Proveedor de notificaciones que envuelve las rutas de usuario.
 * Mantiene la suscripción Realtime activa y comparte el estado
 * entre la navbar (badge) y la página de notificaciones.
 */
export function ProveedorNotificaciones({ children }: { children: ReactNode }) {
    const valor = useNotificaciones();

    return (
        <ContextoNotificacionesReact.Provider value={valor}>
            {children}
        </ContextoNotificacionesReact.Provider>
    );
}

/**
 * Hook para acceder al contexto de notificaciones.
 * Debe usarse dentro de un ProveedorNotificaciones.
 */
export function useContextoNotificaciones(): ContextoNotificaciones {
    const contexto = useContext(ContextoNotificacionesReact);
    if (!contexto) {
        throw new Error(
            'useContextoNotificaciones debe usarse dentro de ProveedorNotificaciones'
        );
    }
    return contexto;
}
