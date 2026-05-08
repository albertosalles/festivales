'use client';

import { useState } from 'react';
import { tpvServicio } from '@/servicios/tpv.servicio';
import type { Incidencia } from '@/lib/tipos';

const META_INCIDENCIA: Record<string, { icono: string; nombre: string }> = {
    stock:     { icono: 'inventory_2',       nombre: 'Falta de Stock' },
    limpieza:  { icono: 'cleaning_services', nombre: 'Limpieza' },
    seguridad: { icono: 'security',          nombre: 'Seguridad / Altercado' },
    soporte:   { icono: 'support_agent',     nombre: 'Soporte Técnico' },
    otros:     { icono: 'help',              nombre: 'Otros' },
};

interface Props {
    incidencias: Incidencia[];
    nombreBarra: string;
    onCerrar: () => void;
    onResuelta: (idIncidencia: number) => void;
}

export function ModalIncidencias({ incidencias, nombreBarra, onCerrar, onResuelta }: Props) {
    const [resolviendo, setResolviendo] = useState<number | null>(null);

    const resolver = async (idIncidencia: number) => {
        setResolviendo(idIncidencia);
        try {
            await tpvServicio.resolverIncidencia(idIncidencia);
            onResuelta(idIncidencia);
        } catch {
            // Silent — el realtime actualizará el estado igualmente
        } finally {
            setResolviendo(null);
        }
    };

    const formatearFecha = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onCerrar}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Panel */}
            <div
                className="relative z-10 w-full max-w-md bg-surface-container rounded-[2rem] border border-error/30 shadow-[0_0_40px_rgba(255,110,132,0.2)] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4 border-b border-outline-variant/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-error text-xl">warning</span>
                        </div>
                        <div>
                            <p className="text-error font-bold text-[10px] uppercase tracking-widest">Incidencias activas</p>
                            <h2 className="font-headline font-black text-lg uppercase tracking-tighter text-on-surface">
                                {nombreBarra}
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={onCerrar}
                        className="w-9 h-9 rounded-xl bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>

                {/* Lista */}
                <div className="p-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
                    {incidencias.length === 0 ? (
                        <p className="text-center text-on-surface-variant text-sm py-6">
                            Sin incidencias pendientes
                        </p>
                    ) : (
                        incidencias.map((inc) => {
                            const meta = META_INCIDENCIA[inc.tipoIncidencia] ?? META_INCIDENCIA.otros;
                            return (
                                <div
                                    key={inc.idIncidencia}
                                    className="bg-surface-container-high rounded-2xl p-4 flex gap-3"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-error text-xl">
                                            {meta.icono}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-headline font-bold text-sm uppercase text-on-surface">
                                                {meta.nombre}
                                            </p>
                                            <span className="text-on-surface-variant text-[10px] font-mono shrink-0">
                                                {formatearFecha(inc.fechaReporte)}
                                            </span>
                                        </div>
                                        {inc.descripcion && (
                                            <p className="text-on-surface-variant text-xs mt-1 leading-relaxed">
                                                {inc.descripcion}
                                            </p>
                                        )}
                                        <button
                                            onClick={() => resolver(inc.idIncidencia)}
                                            disabled={resolviendo === inc.idIncidencia}
                                            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neon-green/10 text-neon-green text-xs font-bold uppercase tracking-wider hover:bg-neon-green/20 disabled:opacity-50 transition-all active:scale-95"
                                        >
                                            <span className="material-symbols-outlined text-sm">
                                                {resolviendo === inc.idIncidencia ? 'hourglass_empty' : 'check_circle'}
                                            </span>
                                            {resolviendo === inc.idIncidencia ? 'Resolviendo...' : 'Marcar resuelta'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
