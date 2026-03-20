'use client';

import { useBarrasEnTiempoReal } from '@/hooks/useBarrasEnTiempoReal';
import { cn } from '@/lib/utils';
import type { Barra, EstadoCola } from '@/lib/tipos';

interface MapaRecintoProps {
    barrasIniciales: Barra[];
}

/** Posiciones predefinidas para los marcadores del mapa */
const POSICIONES_MARCADORES: Record<number, { top: string; left: string }> = {};

/** Genera una posición para un marcador basado en su id */
function obtenerPosicion(indice: number, total: number) {
    // Distribución en espiral simple dentro del area de mapa
    const angulo = (indice / total) * 2 * Math.PI;
    const radio = 25 + (indice % 3) * 10;
    const top = 50 + radio * Math.sin(angulo);
    const left = 50 + radio * Math.cos(angulo);
    return { top: `${Math.max(15, Math.min(75, top))}%`, left: `${Math.max(10, Math.min(85, left))}%` };
}

/** Colores del indicador por estado */
const COLORES_ESTADO: Record<EstadoCola, { bg: string; border: string; text: string; glow: string }> = {
    baja: {
        bg: 'bg-status-low',
        border: 'border-status-low',
        text: 'text-status-low',
        glow: 'status-glow-low',
    },
    media: {
        bg: 'bg-status-medium',
        border: 'border-status-medium',
        text: 'text-status-medium',
        glow: 'status-glow-medium',
    },
    alta: {
        bg: 'bg-status-high',
        border: 'border-status-high',
        text: 'text-status-high',
        glow: 'status-glow-high',
    },
};

/** Etiqueta de tiempo por estado */
const TIEMPO_POR_ESTADO: Record<EstadoCola, string> = {
    baja: '< 5 min',
    media: '~10 min',
    alta: '> 20 min',
};

/**
 * Mapa interactivo SVG del recinto con marcadores de barras en tiempo real.
 * Cada marcador muestra el estado en color con tooltip on hover.
 */
export function MapaRecinto({ barrasIniciales }: MapaRecintoProps) {
    const barras = useBarrasEnTiempoReal(barrasIniciales);

    return (
        <div className="relative w-full h-[70vh] min-h-[500px] rounded-[2rem] overflow-hidden bg-surface-container-lowest">
            {/* SVG Background Grid */}
            <svg
                className="absolute inset-0 w-full h-full opacity-30"
                preserveAspectRatio="xMidYMid slice"
                viewBox="0 0 1000 1000"
            >
                <path
                    className="neon-path"
                    d="M100,200 Q300,100 500,250 T900,200"
                    fill="none"
                    stroke="#00e3fd"
                    strokeWidth="2"
                    strokeDasharray="10"
                    style={{ filter: 'drop-shadow(0 0 8px #00e3fd)' }}
                />
                <path
                    className="neon-path"
                    d="M50,800 Q250,700 450,850 T850,800"
                    fill="none"
                    stroke="#e9ffba"
                    strokeWidth="2"
                    strokeDasharray="10"
                    style={{ filter: 'drop-shadow(0 0 8px #e9ffba)' }}
                />
                <circle cx="500" cy="500" r="300" fill="none" stroke="#ff7439" strokeDasharray="20 10" strokeWidth="1" />
                <rect x="200" y="300" width="600" height="400" rx="40" fill="none" stroke="#acaaae" strokeWidth="0.5" />
            </svg>

            {/* Search & Title */}
            <div className="absolute top-6 left-6 z-10">
                <h2 className="font-headline font-black text-2xl tracking-tighter text-on-surface mb-2">
                    Mapa del Recinto
                </h2>
                <div className="flex items-center bg-surface-container/80 backdrop-blur-md rounded-xl p-3 shadow-2xl border border-outline-variant/10">
                    <span className="material-symbols-outlined text-on-surface-variant mr-3">
                        search
                    </span>
                    <input
                        className="bg-transparent border-none focus:ring-0 text-sm text-on-surface placeholder:text-on-surface-variant w-48 outline-none"
                        placeholder="¿A dónde vamos?"
                        type="text"
                    />
                </div>
            </div>

            {/* Queue Legend */}
            <div className="absolute right-6 top-6 z-10">
                <div className="bg-surface-container/80 backdrop-blur-2xl rounded-2xl p-4 shadow-2xl border border-outline-variant/10">
                    <p className="font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">
                        Estado de Colas
                    </p>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-status-low shadow-[0_0_8px_#4ade80]" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface/70">
                                Baja
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-status-medium shadow-[0_0_8px_#fbbf24]" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface/70">
                                Media
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-status-high shadow-[0_0_8px_#f87171]" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface/70">
                                Alta
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dynamic Bar Markers */}
            {barras.map((barra, indice) => {
                const posicion = POSICIONES_MARCADORES[barra.idBarra] || obtenerPosicion(indice, barras.length);
                const colores = COLORES_ESTADO[barra.estadoCola];

                return (
                    <div
                        key={barra.idBarra}
                        className="absolute group cursor-pointer"
                        style={{ top: posicion.top, left: posicion.left }}
                    >
                        <div className="relative flex flex-col items-center">
                            {/* Tooltip on hover */}
                            <div
                                className={cn(
                                    'px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter mb-1 shadow-lg',
                                    'opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap',
                                    colores.bg,
                                    barra.estadoCola === 'baja' || barra.estadoCola === 'media'
                                        ? 'text-black'
                                        : 'text-white'
                                )}
                            >
                                {barra.nombreLocalizacion} • {TIEMPO_POR_ESTADO[barra.estadoCola]}
                            </div>
                            {/* Marker icon */}
                            <div
                                className={cn(
                                    'w-7 h-7 bg-surface-container rounded-full flex items-center justify-center border-2',
                                    colores.border,
                                    colores.glow
                                )}
                            >
                                <span className={cn('material-symbols-outlined text-base', colores.text)}>
                                    local_bar
                                </span>
                            </div>
                            {/* Pulse animation for low queue */}
                            {barra.estadoCola === 'baja' && (
                                <div className="absolute -bottom-1 w-2 h-2 bg-status-low rounded-full animate-ping opacity-50" />
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Empty state */}
            {barras.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-6xl mb-4">map</span>
                        <p className="font-headline font-bold text-lg uppercase">Sin barras en el mapa</p>
                    </div>
                </div>
            )}
        </div>
    );
}
