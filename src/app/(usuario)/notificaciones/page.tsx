'use client';

import { ListaNotificaciones } from '@/components/notificaciones/ListaNotificaciones';
import { useContextoNotificaciones } from '@/components/notificaciones/ProveedorNotificaciones';
import { Button } from '@/components/ui/button';

/**
 * Página de notificaciones — Historial de alertas de cola baja.
 */
export default function PaginaNotificaciones() {
    const { activas, alternarNotificaciones } = useContextoNotificaciones();

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Notificaciones</h2>
                    <p className="text-muted-foreground">
                        Recibe avisos cuando las barras tengan poca cola.
                    </p>
                </div>
                <Button
                    variant={activas ? 'default' : 'outline'}
                    onClick={alternarNotificaciones}
                    className="w-32 transition-all"
                >
                    {activas ? '🔔 Activadas' : '🔕 Desactivadas'}
                </Button>
            </div>

            <ListaNotificaciones />
        </div>
    );
}
