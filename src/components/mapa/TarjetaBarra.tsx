import { cn } from '@/lib/utils';
import {
    COLOR_BORDE_POR_ESTADO,
    COLOR_TEXTO_POR_ESTADO,
    COLOR_FONDO_ICONO_POR_ESTADO,
    BADGE_ESTADO,
    ICONO_POR_ESTADO,
    ANCHO_BARRA_POR_ESTADO,
    TIEMPO_ESPERA_POR_ESTADO,
    GLOW_POR_ESTADO,
} from '@/lib/constantes';
import type { Barra } from '@/lib/tipos';

interface TarjetaBarraProps {
    barra: Barra;
}

/**
 * Tarjeta premium de una barra del recinto estilo Stitch "Electric Nocturne".
 * Card con icono, badge de estado, nombre, barra de progreso con glow.
 */
export function TarjetaBarra({ barra }: TarjetaBarraProps) {
    return (
        <div
            className={cn(
                'bg-surface-container rounded-[2rem] p-6 flex flex-col justify-between border-b-4 shadow-xl hover:translate-y-[-4px] transition-all group',
                COLOR_BORDE_POR_ESTADO[barra.estadoCola]
            )}
        >
            {/* Header: icono + badge */}
            <div className="flex justify-between items-start mb-6">
                <div
                    className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center',
                        COLOR_FONDO_ICONO_POR_ESTADO[barra.estadoCola]
                    )}
                >
                    <span
                        className={cn(
                            'material-symbols-outlined text-3xl',
                            COLOR_TEXTO_POR_ESTADO[barra.estadoCola]
                        )}
                    >
                        {ICONO_POR_ESTADO[barra.estadoCola]}
                    </span>
                </div>
                <span
                    className={cn(
                        'px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full',
                        COLOR_FONDO_ICONO_POR_ESTADO[barra.estadoCola],
                        COLOR_TEXTO_POR_ESTADO[barra.estadoCola]
                    )}
                >
                    {BADGE_ESTADO[barra.estadoCola]}
                </span>
            </div>

            {/* Body: nombre + barra de progreso */}
            <div>
                <h3 className="font-headline text-xl font-extrabold uppercase tracking-tighter text-on-surface mb-1">
                    {barra.nombreLocalizacion}
                </h3>
                <div className="flex items-center gap-3 mt-4">
                    <span
                        className={cn(
                            'font-bold text-xs uppercase tracking-widest',
                            COLOR_TEXTO_POR_ESTADO[barra.estadoCola]
                        )}
                    >
                        Espera: {TIEMPO_ESPERA_POR_ESTADO[barra.estadoCola]}
                    </span>
                    <div className="flex-1 h-1 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                            className={cn(
                                'h-full rounded-full',
                                COLOR_FONDO_POR_ESTADO_BARRA[barra.estadoCola],
                                ANCHO_BARRA_POR_ESTADO[barra.estadoCola],
                                GLOW_POR_ESTADO[barra.estadoCola]
                            )}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

/** Colores de la barra de progreso (fondo sólido) */
const COLOR_FONDO_POR_ESTADO_BARRA: Record<string, string> = {
    baja: 'bg-neon-green',
    media: 'bg-neon-orange',
    alta: 'bg-error',
};
