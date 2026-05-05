'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { EstadoFestival, Festival } from '@/lib/tipos';
import { FormularioFestival } from './FormularioFestival';
import { RUTAS } from '@/lib/constantes';

interface Props {
    festivalesIniciales: Festival[];
}

const ETIQUETA_ESTADO: Record<EstadoFestival, string> = {
    en_curso: 'En curso',
    finalizado: 'Finalizado',
    resumen_generado: 'Resumen generado',
    anonimizado: 'Anonimizado',
    purgado: 'Purgado',
};

const COLOR_ESTADO: Record<EstadoFestival, { texto: string; fondo: string }> = {
    en_curso: { texto: 'text-neon-green', fondo: 'bg-neon-green/10' },
    finalizado: { texto: 'text-neon-blue', fondo: 'bg-neon-blue/10' },
    resumen_generado: { texto: 'text-neon-orange', fondo: 'bg-neon-orange/10' },
    anonimizado: { texto: 'text-neon-orange', fondo: 'bg-neon-orange/10' },
    purgado: { texto: 'text-on-surface-variant', fondo: 'bg-white/5' },
};

/**
 * Lista interactiva de festivales con acciones de gestión.
 */
export function ListaFestivales({ festivalesIniciales }: Props) {
    const [festivales, setFestivales] = useState(festivalesIniciales);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [accionEnCurso, setAccionEnCurso] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const recargar = async () => {
        const res = await fetch('/api/festivales');
        if (res.ok) {
            const { festivales: data } = await res.json();
            setFestivales(data as Festival[]);
        }
        router.refresh();
    };

    const ejecutarAccion = async (
        idFestival: number,
        accion: 'activar' | 'finalizar',
    ) => {
        setAccionEnCurso(idFestival);
        setError(null);
        try {
            const res = await fetch('/api/festivales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accion, idFestival }),
            });
            if (!res.ok) {
                const { error: msg } = await res.json();
                throw new Error(msg || 'Error en la acción');
            }
            await recargar();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
        } finally {
            setAccionEnCurso(null);
        }
    };

    const onCreado = async () => {
        setMostrarFormulario(false);
        await recargar();
    };

    return (
        <div>
            {/* Acción superior */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <p className="text-on-surface-variant text-sm">
                        {festivales.length} {festivales.length === 1 ? 'edición' : 'ediciones'} registrada{festivales.length === 1 ? '' : 's'}
                    </p>
                </div>
                <button
                    onClick={() => setMostrarFormulario(true)}
                    className="flex items-center gap-2 bg-neon-green text-black font-bold uppercase tracking-widest text-xs px-5 py-3 rounded-lg hover:brightness-110 transition-all shadow-[0_0_20px_rgba(186,253,0,0.3)]"
                >
                    <span className="material-symbols-outlined text-base">add</span>
                    Nuevo festival
                </button>
            </div>

            {error && (
                <div className="bg-error/10 border border-error/30 rounded-xl p-4 mb-6">
                    <p className="text-error text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Grid de tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {festivales.map((f) => {
                    const colorEstado = COLOR_ESTADO[f.estado];
                    const cargandoEste = accionEnCurso === f.idFestival;

                    return (
                        <div
                            key={f.idFestival}
                            className={cn(
                                'bg-surface-container rounded-xl p-6 relative overflow-hidden transition-all',
                                f.activo && 'border border-neon-green/40 shadow-[0_0_25px_rgba(186,253,0,0.15)]',
                            )}
                        >
                            {/* Badge ACTIVO */}
                            {f.activo && (
                                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-tighter text-neon-green">
                                        Activo
                                    </span>
                                </div>
                            )}

                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">
                                        Edición #{f.idFestival}
                                    </p>
                                    <h3 className="font-headline text-2xl font-bold text-on-surface">
                                        {f.nombre}
                                    </h3>
                                </div>
                            </div>

                            <div className="space-y-2 mb-5 text-sm">
                                <div className="flex items-center gap-2 text-on-surface-variant">
                                    <span className="material-symbols-outlined text-base">place</span>
                                    {f.ubicacion ?? <span className="italic">Sin ubicación</span>}
                                </div>
                                <div className="flex items-center gap-2 text-on-surface-variant">
                                    <span className="material-symbols-outlined text-base">event</span>
                                    {f.fechaInicio || f.fechaFin
                                        ? `${f.fechaInicio ?? '?'} → ${f.fechaFin ?? '?'}`
                                        : <span className="italic">Sin fechas</span>}
                                </div>
                            </div>

                            <span
                                className={cn(
                                    'inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-5',
                                    colorEstado.texto,
                                    colorEstado.fondo,
                                )}
                            >
                                {ETIQUETA_ESTADO[f.estado]}
                            </span>

                            {/* Acciones */}
                            <div className="flex gap-2 pt-4 border-t border-white/5">
                                <Link
                                    href={`${RUTAS.ADMIN_FESTIVALES}/${f.idFestival}`}
                                    className="flex-1 text-center text-xs font-bold uppercase tracking-widest bg-white/5 text-on-surface-variant hover:bg-white/10 hover:text-on-surface transition-colors py-2.5 rounded-lg"
                                >
                                    Detalles
                                </Link>
                                {!f.activo && f.estado !== 'purgado' && (
                                    <button
                                        onClick={() => ejecutarAccion(f.idFestival, 'activar')}
                                        disabled={cargandoEste}
                                        className="flex-1 text-xs font-bold uppercase tracking-widest bg-neon-green/10 text-neon-green hover:bg-neon-green/20 transition-colors py-2.5 rounded-lg disabled:opacity-50"
                                    >
                                        {cargandoEste ? '...' : 'Activar'}
                                    </button>
                                )}
                                {f.activo && (
                                    <button
                                        onClick={() => ejecutarAccion(f.idFestival, 'finalizar')}
                                        disabled={cargandoEste}
                                        className="flex-1 text-xs font-bold uppercase tracking-widest bg-neon-orange/10 text-neon-orange hover:bg-neon-orange/20 transition-colors py-2.5 rounded-lg disabled:opacity-50"
                                    >
                                        {cargandoEste ? '...' : 'Finalizar'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Formulario modal */}
            {mostrarFormulario && (
                <FormularioFestival
                    onCancelar={() => setMostrarFormulario(false)}
                    onCreado={onCreado}
                />
            )}
        </div>
    );
}
