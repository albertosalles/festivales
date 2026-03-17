'use client';

import { useContextoNotificaciones } from '@/components/notificaciones/ProveedorNotificaciones';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Lista de notificaciones del usuario.
 * Muestra las alertas de cola baja con hora y estado de lectura.
 */
export function ListaNotificaciones() {
    const { notificaciones, noLeidas, marcarComoLeida, marcarTodasComoLeidas } =
        useContextoNotificaciones();

    if (notificaciones.length === 0) {
        return (
            <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
                <p className="text-4xl">🔔</p>
                <p className="mt-4 text-lg font-medium">Sin notificaciones</p>
                <p className="text-sm">
                    Te avisaremos cuando una barra tenga poca cola.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Botón para marcar todas como leídas */}
            {noLeidas > 0 && (
                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={marcarTodasComoLeidas}
                        className="text-xs text-muted-foreground"
                    >
                        Marcar todas como leídas
                    </Button>
                </div>
            )}

            {notificaciones.map((notificacion) => (
                <Card
                    key={notificacion.id}
                    className={cn(
                        'cursor-pointer transition-all',
                        notificacion.leida
                            ? 'opacity-60'
                            : 'border-green-500/50 bg-green-50 dark:bg-green-950/20'
                    )}
                    onClick={() => {
                        if (!notificacion.leida) {
                            marcarComoLeida(notificacion.id);
                        }
                    }}
                >
                    <CardContent className="flex items-start gap-3 p-4">
                        <span className="mt-0.5 text-xl">
                            {notificacion.leida ? '🔕' : '🟢'}
                        </span>
                        <div className="flex-1">
                            <p className={cn(
                                'text-sm',
                                !notificacion.leida && 'font-semibold'
                            )}>
                                {notificacion.mensaje}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {formatearFecha(notificacion.fecha)}
                            </p>
                        </div>
                        {!notificacion.leida && (
                            <span className="mt-1 h-2 w-2 rounded-full bg-green-500" />
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

/** Formatea la fecha de la notificación de forma legible */
function formatearFecha(fecha: Date): string {
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();
    const minutos = Math.floor(diferencia / 60000);

    if (minutos < 1) return 'Ahora mismo';
    if (minutos < 60) return `Hace ${minutos} min`;

    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas}h`;

    return fecha.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}
