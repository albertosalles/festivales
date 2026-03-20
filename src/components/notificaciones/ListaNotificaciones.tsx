'use client';

import Link from 'next/link';
import { useContextoNotificaciones } from '@/components/notificaciones/ProveedorNotificaciones';
import { cn } from '@/lib/utils';
import { RUTAS } from '@/lib/constantes';

/**
 * Lista de notificaciones estilo Stitch "Electric Nocturne".
 * Cards glassmórficas con border-l-4 de color, iconos Material Symbols y timestamps.
 */
export function ListaNotificaciones() {
    const { notificaciones, noLeidas, marcarComoLeida, marcarTodasComoLeidas } =
        useContextoNotificaciones();

    if (notificaciones.length === 0) {
        return (
            <div className="glass-card rounded-[2rem] p-12 text-center border border-outline-variant/10">
                <span className="material-symbols-outlined text-on-surface-variant text-6xl">
                    notifications_none
                </span>
                <p className="mt-4 text-lg font-headline font-bold text-on-surface uppercase tracking-tight">
                    Sin alertas
                </p>
                <p className="text-sm text-on-surface-variant mt-2">
                    Te avisaremos cuando una barra tenga poca cola.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Botón para marcar todas como leídas */}
            {noLeidas > 0 && (
                <div className="flex justify-end">
                    <button
                        onClick={marcarTodasComoLeidas}
                        className="text-xs text-on-surface-variant hover:text-neon-blue transition-colors font-medium uppercase tracking-wider"
                    >
                        Marcar todas como leídas
                    </button>
                </div>
            )}

            {notificaciones.map((notificacion) => {
                const esNoLeida = !notificacion.leida;

                return (
                    <div
                        key={notificacion.id}
                        onClick={() => {
                            if (esNoLeida) {
                                marcarComoLeida(notificacion.id);
                            }
                        }}
                        className={cn(
                            'p-5 rounded-xl relative overflow-hidden group cursor-pointer transition-all',
                            esNoLeida
                                ? 'glass-card border-l-4 border-neon-green'
                                : 'bg-surface-container/40 border border-outline-variant/10 opacity-70'
                        )}
                    >
                        {/* Background decorative icon */}
                        {esNoLeida && (
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-outlined text-neon-green text-6xl">
                                    local_bar
                                </span>
                            </div>
                        )}

                        <div className="flex gap-4 items-start relative z-10">
                            {/* Icon badge */}
                            <div
                                className={cn(
                                    'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                                    esNoLeida ? 'bg-neon-green/10' : 'bg-outline-variant/20'
                                )}
                            >
                                <span
                                    className={cn(
                                        'material-symbols-outlined',
                                        esNoLeida ? 'text-neon-green' : 'text-on-surface-variant'
                                    )}
                                >
                                    {esNoLeida ? 'speed' : 'notifications'}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h3
                                        className={cn(
                                            'font-headline font-bold text-lg uppercase tracking-tight',
                                            esNoLeida ? 'text-neon-green' : 'text-on-surface-variant'
                                        )}
                                    >
                                        {esNoLeida
                                            ? '¡Cola baja disponible!'
                                            : 'Alerta leída'}
                                    </h3>
                                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">
                                        {formatearFecha(notificacion.fecha)}
                                    </span>
                                </div>
                                <p
                                    className={cn(
                                        'font-medium leading-snug',
                                        esNoLeida ? 'text-on-surface' : 'text-on-surface-variant'
                                    )}
                                >
                                    {notificacion.mensaje}
                                </p>
                                {esNoLeida && (
                                    <div className="mt-4 flex gap-2">
                                        <Link
                                            href={RUTAS.MAPA}
                                            className="bg-neon-green text-[#496600] px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider active:scale-95 transition-transform"
                                        >
                                            Ver en Mapa
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/** Formatea la fecha de la notificación de forma legible */
function formatearFecha(fecha: Date): string {
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();
    const minutos = Math.floor(diferencia / 60000);

    if (minutos < 1) return 'AHORA';
    if (minutos < 60) return `${minutos} MIN`;

    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `${horas}H`;

    return fecha.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).toUpperCase();
}
