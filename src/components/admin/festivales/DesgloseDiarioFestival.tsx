import type { DatosDiaFestival } from '@/lib/tipos';
import type { EdicionConDatosDia } from '@/servicios/festivales.servicio';
import { formatearMoneda } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Props {
    nombreEdicion: string;
    datosPorDia: DatosDiaFestival[];
    otrasEdiciones: EdicionConDatosDia[];
}

const DIAS = [
    { relativo: 1 as const, etiqueta: 'Viernes' },
    { relativo: 2 as const, etiqueta: 'Sábado' },
    { relativo: 3 as const, etiqueta: 'Domingo' },
];

/** Paleta de colores para ediciones pasadas (rota cíclicamente). */
const PALETA_OTRAS = [
    'bg-neon-blue/70',
    'bg-purple-400/70',
    'bg-pink-400/70',
    'bg-yellow-400/70',
    'bg-cyan-400/70',
];

/**
 * Sección detallada de desglose diario para la página de un festival.
 *
 * Muestra:
 *  1. Gráfico de barras agrupadas Vie/Sáb/Dom × N ediciones (solo si hay
 *     otras ediciones con datos para comparar)
 *  2. Tabla expandida del desglose diario de la edición actual, con detalle
 *     por barra para cada día (siempre que haya datos)
 *
 * Si la edición actual no tiene datos_por_dia, no se renderiza nada.
 */
export function DesgloseDiarioFestival({
    nombreEdicion,
    datosPorDia,
    otrasEdiciones,
}: Props) {
    if (datosPorDia.length === 0) return null;

    const haySoloVieSabDom = datosPorDia.some(
        (d) => d.dia_relativo !== null && d.dia_relativo >= 1 && d.dia_relativo <= 3,
    );
    const tieneComparativa = otrasEdiciones.length > 0 && haySoloVieSabDom;

    // Edicion actual + otras = todas las que entran en el gráfico comparativo
    const edicionesGrafico: EdicionConDatosDia[] = tieneComparativa
        ? [
            { idFestival: -1, nombre: nombreEdicion, datosPorDia },
            ...otrasEdiciones,
        ]
        : [];

    // Máximo global de ingresos en cualquier día/edición → escala del gráfico
    const maxIngreso = Math.max(
        1,
        ...edicionesGrafico.flatMap((e) =>
            e.datosPorDia
                .filter((d) => d.dia_relativo !== null && d.dia_relativo >= 1 && d.dia_relativo <= 3)
                .map((d) => d.ingresos),
        ),
    );

    return (
        <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-neon-blue">calendar_view_week</span>
                <h2 className="font-headline text-xl font-bold text-on-surface">
                    Desglose diario
                </h2>
                {tieneComparativa && (
                    <span className="text-[10px] font-normal tracking-widest uppercase bg-surface-container-high px-2 py-1 rounded ml-auto">
                        Comparado con {otrasEdiciones.length}{' '}
                        {otrasEdiciones.length === 1 ? 'edición' : 'ediciones'}
                    </span>
                )}
            </div>

            {/* Gráfico comparativo (solo si hay otras ediciones) */}
            {tieneComparativa && (
                <GraficoBarrasAgrupadas
                    ediciones={edicionesGrafico}
                    maxIngreso={maxIngreso}
                />
            )}

            {/* Tabla con desglose por día y por barra (de la edición actual) */}
            <TablaDesgloseDiario datosPorDia={datosPorDia} />
        </section>
    );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Gráfico de barras agrupadas Vie/Sáb/Dom × N ediciones              */
/* ─────────────────────────────────────────────────────────────────── */

interface PropsGrafico {
    ediciones: EdicionConDatosDia[];
    maxIngreso: number;
}

function GraficoBarrasAgrupadas({ ediciones, maxIngreso }: PropsGrafico) {
    // Generar líneas de cuadrícula horizontales: 0, 25%, 50%, 75%, 100%
    const lineas = [1, 0.75, 0.5, 0.25, 0];

    return (
        <div className="bg-surface-container rounded-xl p-6 mb-4">
            {/* Cuerpo del gráfico */}
            <div className="flex gap-4 h-64 relative">
                {/* Eje Y: etiquetas */}
                <div className="w-12 flex flex-col justify-between text-[10px] text-on-surface-variant text-right pt-1 pb-6">
                    {lineas.map((frac) => (
                        <span key={frac} className="tabular-nums">
                            {formatearMoneda(maxIngreso * frac).replace(/\s?€/, '')}
                        </span>
                    ))}
                </div>

                {/* Área de barras + cuadrícula */}
                <div className="flex-1 relative">
                    {/* Cuadrícula horizontal */}
                    <div className="absolute inset-0 flex flex-col justify-between pb-6 pointer-events-none">
                        {lineas.map((frac) => (
                            <div
                                key={frac}
                                className={cn(
                                    'h-px w-full',
                                    frac === 0 ? 'bg-white/20' : 'bg-white/5',
                                )}
                            />
                        ))}
                    </div>

                    {/* Grupos por día */}
                    <div className="flex h-full pb-6">
                        {DIAS.map((dia) => (
                            <div
                                key={dia.relativo}
                                className="flex-1 flex flex-col items-center relative"
                            >
                                {/* Grupo de barras del día */}
                                <div className="flex-1 w-full flex items-end justify-center gap-1.5 px-3 relative">
                                    {ediciones.map((edicion, idx) => {
                                        const datos = edicion.datosPorDia.find(
                                            (d) => d.dia_relativo === dia.relativo,
                                        );
                                        const ingresos = datos?.ingresos ?? 0;
                                        const altura = (ingresos / maxIngreso) * 100;
                                        const esActual = idx === 0;
                                        const colorClass = esActual
                                            ? 'bg-neon-green shadow-[0_0_15px_rgba(186,253,0,0.4)]'
                                            : PALETA_OTRAS[(idx - 1) % PALETA_OTRAS.length];

                                        return (
                                            <div
                                                key={edicion.idFestival}
                                                className="flex-1 max-w-[40px] h-full flex flex-col justify-end group relative"
                                            >
                                                {/* Tooltip de hover */}
                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                    <div className="bg-surface-container-high rounded px-2 py-1 text-[10px] whitespace-nowrap shadow-lg">
                                                        <p className="font-bold text-on-surface">
                                                            {edicion.nombre}
                                                        </p>
                                                        <p className="text-neon-green tabular-nums">
                                                            {formatearMoneda(ingresos)}
                                                        </p>
                                                        {datos?.transacciones ? (
                                                            <p className="text-on-surface-variant">
                                                                {datos.transacciones} trans.
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                {/* Barra */}
                                                <div
                                                    className={cn(
                                                        'w-full rounded-t-sm transition-all',
                                                        colorClass,
                                                        ingresos === 0 && 'opacity-30',
                                                    )}
                                                    style={{ height: `${Math.max(altura, ingresos > 0 ? 1 : 0)}%` }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Etiqueta del día */}
                                <p className="text-xs font-bold text-on-surface mt-2 absolute bottom-0">
                                    {dia.etiqueta}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/5">
                {ediciones.map((edicion, idx) => {
                    const esActual = idx === 0;
                    const colorClass = esActual
                        ? 'bg-neon-green'
                        : PALETA_OTRAS[(idx - 1) % PALETA_OTRAS.length];
                    return (
                        <div
                            key={edicion.idFestival}
                            className="flex items-center gap-2 text-xs"
                        >
                            <span className={cn('w-3 h-3 rounded-sm', colorClass)} />
                            <span
                                className={cn(
                                    'font-medium',
                                    esActual ? 'text-on-surface' : 'text-on-surface-variant',
                                )}
                            >
                                {edicion.nombre}
                                {esActual && (
                                    <span className="text-[10px] uppercase tracking-widest text-neon-green ml-2 font-bold">
                                        actual
                                    </span>
                                )}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Tabla con desglose por día (incluye barras de cada día)            */
/* ─────────────────────────────────────────────────────────────────── */

function TablaDesgloseDiario({ datosPorDia }: { datosPorDia: DatosDiaFestival[] }) {
    // Ordenar: primero los días con dia_relativo (1, 2, 3), luego el resto
    const ordenados = [...datosPorDia].sort((a, b) => {
        if (a.dia_relativo === null && b.dia_relativo === null) return a.fecha.localeCompare(b.fecha);
        if (a.dia_relativo === null) return 1;
        if (b.dia_relativo === null) return -1;
        return a.dia_relativo - b.dia_relativo;
    });

    return (
        <div className="space-y-3">
            {ordenados.map((dia) => (
                <details
                    key={dia.fecha}
                    className="bg-surface-container rounded-xl group"
                    open={dia.dia_relativo !== null}
                >
                    <summary className="cursor-pointer p-5 flex items-center justify-between gap-4 list-none">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-surface-container-high flex flex-col items-center justify-center shrink-0">
                                {dia.dia_relativo !== null ? (
                                    <>
                                        <span className="text-[10px] text-on-surface-variant uppercase tracking-tighter">
                                            Día
                                        </span>
                                        <span className="font-headline text-lg font-bold text-neon-green leading-none">
                                            {dia.dia_relativo}
                                        </span>
                                    </>
                                ) : (
                                    <span className="material-symbols-outlined text-on-surface-variant text-xl">
                                        event
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-on-surface capitalize">
                                    {dia.dia_semana}
                                </p>
                                <p className="text-[11px] text-on-surface-variant">
                                    {dia.fecha} · {dia.transacciones} transacciones · ticket medio{' '}
                                    {formatearMoneda(dia.ticket_medio)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <p className="font-headline text-xl font-bold text-neon-green tabular-nums">
                                {formatearMoneda(dia.ingresos)}
                            </p>
                            <span className="material-symbols-outlined text-on-surface-variant text-base group-open:rotate-180 transition-transform">
                                expand_more
                            </span>
                        </div>
                    </summary>

                    {/* Desglose por barra del día */}
                    <div className="px-5 pb-5 border-t border-white/5">
                        {dia.barras.length === 0 ? (
                            <p className="text-sm text-on-surface-variant italic mt-3">
                                Sin desglose por barra
                            </p>
                        ) : (
                            <table className="w-full text-sm mt-3">
                                <thead>
                                    <tr className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                                        <th className="text-left pb-2 font-medium">Barra</th>
                                        <th className="text-right pb-2 font-medium">Trans.</th>
                                        <th className="text-right pb-2 font-medium">Ingresos</th>
                                        <th className="text-right pb-2 font-medium w-20">% del día</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dia.barras.map((b) => {
                                        const pct = dia.ingresos > 0
                                            ? (b.ingresos / dia.ingresos) * 100
                                            : 0;
                                        return (
                                            <tr
                                                key={b.id_barra}
                                                className="border-t border-white/5"
                                            >
                                                <td className="py-2 font-medium text-on-surface">
                                                    {b.nombre}
                                                </td>
                                                <td className="py-2 text-right text-on-surface-variant tabular-nums">
                                                    {b.num_transacciones}
                                                </td>
                                                <td className="py-2 text-right text-neon-green tabular-nums">
                                                    {formatearMoneda(b.ingresos)}
                                                </td>
                                                <td className="py-2 text-right text-on-surface-variant tabular-nums">
                                                    {pct.toFixed(1)}%
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </details>
            ))}
        </div>
    );
}
