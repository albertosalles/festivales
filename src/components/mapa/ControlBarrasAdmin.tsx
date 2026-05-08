'use client';

import Link from 'next/link';
import { useBarrasEnTiempoReal } from '@/hooks/useBarrasEnTiempoReal';
import { useIncidenciasEnTiempoReal } from '@/hooks/useIncidenciasEnTiempoReal';
import { ModalIncidencias } from '@/components/mapa/ModalIncidencias';
import { cn, formatearMoneda } from '@/lib/utils';
import {
    COLOR_BORDE_POR_ESTADO,
    COLOR_TEXTO_POR_ESTADO,
    COLOR_FONDO_ICONO_POR_ESTADO,
    COLOR_FONDO_POR_ESTADO,
    BADGE_ESTADO,
    ICONO_POR_ESTADO,
    ANCHO_BARRA_POR_ESTADO,
    TIEMPO_ESPERA_POR_ESTADO,
    GLOW_POR_ESTADO,
    ESTADOS_COLA,
    RUTAS,
} from '@/lib/constantes';
import type { Barra, Camarero, EstadoCola, Incidencia } from '@/lib/tipos';
import { useState } from 'react';

interface ControlBarrasAdminProps {
    barrasIniciales: Barra[];
    camarerosIniciales: Camarero[];
    ingresosPorBarra: Record<number, number>;
    incidenciasIniciales: Incidencia[];
}

/**
 * Grid de barras admin con cambio de estado de cola, asignación rápida
 * de camareros (+/-), KPI de ingresos, alertas de incidencias y enlace a detalle.
 * Diseño Stitch "Electric Nocturne".
 */
export function ControlBarrasAdmin({
    barrasIniciales,
    camarerosIniciales,
    ingresosPorBarra,
    incidenciasIniciales,
}: ControlBarrasAdminProps) {
    const barras = useBarrasEnTiempoReal(barrasIniciales);
    const incidencias = useIncidenciasEnTiempoReal(incidenciasIniciales);
    const [actualizando, setActualizando] = useState<number | null>(null);
    const [camareros, setCamareros] = useState(camarerosIniciales);
    const [barraModalIncidencias, setBarraModalIncidencias] = useState<number | null>(null);

    /** Camareros activos y sin barra asignada */
    const camarerosDisponibles = camareros.filter((c) => c.activo && !c.idBarraActual);

    /** Cantidad de camareros asignados a una barra */
    const contarCamarerosBarra = (idBarra: number) =>
        camareros.filter((c) => c.idBarraActual === idBarra).length;

    /** Incidencias pendientes de una barra concreta */
    const incidenciasBarra = (idBarra: number) =>
        incidencias.filter((i) => i.idBarra === idBarra);

    const cambiarEstado = async (idBarra: number, nuevoEstado: EstadoCola) => {
        setActualizando(idBarra);
        try {
            await fetch('/api/barras/estado', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idBarra, estadoCola: nuevoEstado }),
            });
        } catch {
            // Silent
        } finally {
            setActualizando(null);
        }
    };

    /** Asigna un camarero libre a esta barra */
    const agregarCamarero = async (idBarra: number) => {
        const libre = camarerosDisponibles[0];
        if (!libre) return;

        setActualizando(idBarra);
        try {
            const res = await fetch('/api/camareros', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accion: 'asignar',
                    idCamarero: libre.idCamarero,
                    idBarra,
                }),
            });
            if (res.ok) {
                setCamareros((prev) =>
                    prev.map((c) =>
                        c.idCamarero === libre.idCamarero
                            ? { ...c, idBarraActual: idBarra }
                            : c
                    )
                );
            }
        } catch { /* silent */ }
        finally { setActualizando(null); }
    };

    /** Desasigna el último camarero de esta barra */
    const quitarCamarero = async (idBarra: number) => {
        const asignados = camareros.filter((c) => c.idBarraActual === idBarra);
        const ultimo = asignados[asignados.length - 1];
        if (!ultimo) return;

        setActualizando(idBarra);
        try {
            const res = await fetch('/api/camareros', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accion: 'asignar',
                    idCamarero: ultimo.idCamarero,
                    idBarra: null,
                }),
            });
            if (res.ok) {
                setCamareros((prev) =>
                    prev.map((c) =>
                        c.idCamarero === ultimo.idCamarero
                            ? { ...c, idBarraActual: undefined }
                            : c
                    )
                );
            }
        } catch { /* silent */ }
        finally { setActualizando(null); }
    };

    if (barras.length === 0) {
        return (
            <div className="bg-surface-container rounded-xl p-12 text-center">
                <span className="material-symbols-outlined text-on-surface-variant text-6xl">local_bar</span>
                <p className="mt-4 text-lg font-headline font-bold text-on-surface uppercase">
                    No hay barras registradas
                </p>
            </div>
        );
    }

    const barraModal = barraModalIncidencias !== null
        ? barras.find((b) => b.idBarra === barraModalIncidencias)
        : null;

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {barras.map((barra) => {
                    const numCamareros = contarCamarerosBarra(barra.idBarra);
                    const ingresos = ingresosPorBarra[barra.idBarra] ?? 0;
                    const hayDisponibles = camarerosDisponibles.length > 0;
                    const alertas = incidenciasBarra(barra.idBarra);
                    const numAlertas = alertas.length;

                    return (
                        <div
                            key={barra.idBarra}
                            className={cn(
                                'bg-surface-container rounded-[2rem] p-6 flex flex-col gap-4 border-b-4 shadow-xl hover:translate-y-[-4px] transition-all',
                                COLOR_BORDE_POR_ESTADO[barra.estadoCola]
                            )}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-start">
                                <div className="relative">
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
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Badge incidencias */}
                                    {numAlertas > 0 && (
                                        <button
                                            onClick={() => setBarraModalIncidencias(barra.idBarra)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-error/10 border border-error/30 text-error hover:bg-error/20 transition-all active:scale-95 animate-pulse"
                                            title={`${numAlertas} incidencia${numAlertas > 1 ? 's' : ''} pendiente${numAlertas > 1 ? 's' : ''}`}
                                        >
                                            <span className="material-symbols-outlined text-sm">warning</span>
                                            <span className="font-black text-xs">{numAlertas}</span>
                                        </button>
                                    )}
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
                            </div>

                            {/* Nombre */}
                            <h3 className="font-headline text-xl font-extrabold uppercase tracking-tighter text-on-surface">
                                {barra.nombreLocalizacion}
                            </h3>

                            {/* Estado de la cola */}
                            <div>
                                <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest mb-2">
                                    Estado de la cola
                                </p>
                                <div className="flex gap-2">
                                    {ESTADOS_COLA.map((estado) => (
                                        <button
                                            key={estado}
                                            onClick={() => cambiarEstado(barra.idBarra, estado)}
                                            disabled={actualizando === barra.idBarra}
                                            className={cn(
                                                'px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all active:scale-95',
                                                barra.estadoCola === estado
                                                    ? cn(COLOR_FONDO_POR_ESTADO[estado], 'text-[#0e0e11]')
                                                    : 'bg-surface-container-high text-on-surface-variant hover:brightness-125'
                                            )}
                                        >
                                            {estado}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Personal +/- */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest mb-1">
                                        Personal
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => quitarCamarero(barra.idBarra)}
                                            disabled={actualizando === barra.idBarra || numCamareros === 0}
                                            className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-error/20 hover:text-error disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-90"
                                        >
                                            <span className="material-symbols-outlined text-sm">remove</span>
                                        </button>
                                        <span className="font-headline text-xl font-black text-on-surface tabular-nums min-w-[2ch] text-center">
                                            {numCamareros}
                                        </span>
                                        <button
                                            onClick={() => agregarCamarero(barra.idBarra)}
                                            disabled={actualizando === barra.idBarra || !hayDisponibles}
                                            title={hayDisponibles ? 'Asignar camarero disponible' : 'No hay camareros disponibles'}
                                            className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-neon-green/20 hover:text-neon-green disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-90"
                                        >
                                            <span className="material-symbols-outlined text-sm">add</span>
                                        </button>
                                    </div>
                                </div>

                                {/* KPI Ingresos */}
                                <div className="text-right">
                                    <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest mb-1">
                                        Recaudación
                                    </p>
                                    <p className="font-headline text-xl font-bold text-neon-green">
                                        {formatearMoneda(ingresos)}
                                    </p>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="flex items-center gap-3">
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
                                            COLOR_FONDO_POR_ESTADO[barra.estadoCola],
                                            ANCHO_BARRA_POR_ESTADO[barra.estadoCola],
                                            GLOW_POR_ESTADO[barra.estadoCola]
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Link to detail */}
                            <Link
                                href={`${RUTAS.ADMIN_BARRAS}/${barra.idBarra}`}
                                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-surface-container-high text-on-surface-variant hover:text-neon-green hover:bg-neon-green/10 text-xs font-bold uppercase tracking-widest transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined text-sm">visibility</span>
                                Ver detalle
                            </Link>
                        </div>
                    );
                })}
            </div>

            {/* Modal incidencias */}
            {barraModal && (
                <ModalIncidencias
                    incidencias={incidenciasBarra(barraModal.idBarra)}
                    nombreBarra={barraModal.nombreLocalizacion}
                    onCerrar={() => setBarraModalIncidencias(null)}
                    onResuelta={() => {
                        // El hook useIncidenciasEnTiempoReal filtrará la incidencia resuelta
                        // en cuanto Supabase Realtime emita el UPDATE. Si no hay más
                        // incidencias en esta barra, cerramos el modal.
                    }}
                />
            )}
        </>
    );
}
