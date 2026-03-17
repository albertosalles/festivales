'use client';

import { ListaNotificaciones } from '@/components/notificaciones/ListaNotificaciones';

/**
 * Página de notificaciones — Historial de alertas de cola baja.
 */
export default function PaginaNotificaciones() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Notificaciones</h2>
                <p className="text-muted-foreground">
                    Recibe avisos cuando las barras tengan poca cola.
                </p>
            </div>

            <ListaNotificaciones />
        </div>
    );
}
