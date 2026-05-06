import { obtenerComparativaDiaria } from '@/servicios/festivales.servicio';
import type { DatosDiaFestival } from '@/lib/tipos';
import { formatearMoneda } from '@/lib/utils';
import { cn } from '@/lib/utils';

const DIAS = [
    { relativo: 1 as const, etiqueta: 'Viernes' },
    { relativo: 2 as const, etiqueta: 'Sábado' },
    { relativo: 3 as const, etiqueta: 'Domingo' },
];

/**
 * Devuelve la entrada del array `datosPorDia` cuyo `dia_relativo` coincida.
 */
function buscarDia(
    datos: DatosDiaFestival[],
    diaRelativo: 1 | 2 | 3,
): DatosDiaFestival | null {
    return datos.find((d) => d.dia_relativo === diaRelativo) ?? null;
}

/**
 * Media de ingresos para un día concreto a través de varias ediciones.
 * Devuelve null si ninguna edición tiene datos para ese día.
 */
function mediaIngresos(
    ediciones: { datosPorDia: DatosDiaFestival[] }[],
    diaRelativo: 1 | 2 | 3,
): number | null {
    const valores = ediciones
        .map((e) => buscarDia(e.datosPorDia, diaRelativo)?.ingresos)
        .filter((v): v is number => typeof v === 'number');
    if (valores.length === 0) return null;
    return valores.reduce((s, v) => s + v, 0) / valores.length;
}

/** Porcentaje de variación: ((actual - referencia) / referencia) * 100 */
function variacionPorcentual(actual: number, referencia: number): number {
    if (referencia === 0) return actual > 0 ? 100 : 0;
    return ((actual - referencia) / referencia) * 100;
}

/**
 * Widget del dashboard que muestra los 3 días del fin de semana del festival
 * activo (viernes/sábado/domingo) y, cuando hay ediciones previas, la
 * variación porcentual de ingresos contra la media histórica del mismo día.
 *
 * Server Component: lee datos en SSR sin parpadeo.
 * Si no hay festival activo, no se renderiza nada.
 */
export async function WidgetComparativaDiaria() {
    const { actual, ediciones } = await obtenerComparativaDiaria();

    if (!actual) return null;

    const numEdicionesPrevias = ediciones.length;
    const tieneComparativa = numEdicionesPrevias > 0;

    return (
        <section className="bg-surface-container rounded-xl p-8 relative overflow-hidden mt-10">
            {/* Cabecera */}
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <h4 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-neon-blue">timeline</span>
                        Comparativa Diaria
                    </h4>
                    <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-tighter mt-1">
                        {actual.nombre} · Rendimiento del fin de semana
                    </p>
                </div>
                <span className="text-[10px] font-normal tracking-widest uppercase bg-surface-container-high px-2 py-1 rounded">
                    {tieneComparativa
                        ? `${numEdicionesPrevias} ${numEdicionesPrevias === 1 ? 'edición previa' : 'ediciones previas'}`
                        : 'Sin histórico aún'}
                </span>
            </div>

            {/* Grid de 3 días */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                {DIAS.map(({ relativo, etiqueta }) => {
                    const diaActual = buscarDia(actual.datosPorDia, relativo);
                    const media = tieneComparativa ? mediaIngresos(ediciones, relativo) : null;

                    const variacion =
                        diaActual && media !== null && media > 0
                            ? variacionPorcentual(diaActual.ingresos, media)
                            : null;

                    return (
                        <TarjetaDia
                            key={relativo}
                            etiqueta={etiqueta}
                            diaRelativo={relativo}
                            datos={diaActual}
                            media={media}
                            variacion={variacion}
                        />
                    );
                })}
            </div>

            {/* Glow decorativo */}
            <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-neon-blue/5 rounded-full blur-[80px]" />
        </section>
    );
}

interface PropsTarjeta {
    etiqueta: string;
    diaRelativo: 1 | 2 | 3;
    datos: DatosDiaFestival | null;
    media: number | null;
    variacion: number | null;
}

function TarjetaDia({ etiqueta, diaRelativo, datos, media, variacion }: PropsTarjeta) {
    const sinDatos = !datos || datos.ingresos === 0;

    return (
        <div className="bg-surface-container-low rounded-xl p-5 border border-white/5">
            {/* Etiqueta del día */}
            <div className="flex justify-between items-baseline mb-4">
                <div>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-medium">
                        Día {diaRelativo}
                    </p>
                    <p className="font-bold text-on-surface text-sm">{etiqueta}</p>
                </div>
                {datos?.transacciones ? (
                    <span className="text-[10px] text-neon-blue bg-neon-blue/10 px-2 py-0.5 rounded-full font-medium">
                        {datos.transacciones} trans.
                    </span>
                ) : null}
            </div>

            {/* Métrica principal */}
            {sinDatos ? (
                <div className="py-2">
                    <p className="font-headline text-2xl font-bold text-on-surface-variant/40 italic">
                        Pendiente
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-1">
                        Sin ventas registradas
                    </p>
                </div>
            ) : (
                <div className="py-2">
                    <p className="font-headline text-3xl font-bold text-neon-green leading-tight">
                        {formatearMoneda(datos!.ingresos)}
                    </p>
                    {datos!.ticket_medio > 0 && (
                        <p className="text-[10px] text-on-surface-variant mt-1">
                            Ticket medio {formatearMoneda(datos!.ticket_medio)}
                        </p>
                    )}
                </div>
            )}

            {/* Comparativa con media histórica */}
            {variacion !== null ? (
                <IndicadorVariacion variacion={variacion} media={media!} />
            ) : (
                <div className="mt-4 pt-3 border-t border-white/5">
                    <p className="text-[10px] text-on-surface-variant/60 italic">
                        {media === null
                            ? 'Sin histórico para este día'
                            : 'Esperando datos…'}
                    </p>
                </div>
            )}
        </div>
    );
}

function IndicadorVariacion({ variacion, media }: { variacion: number; media: number }) {
    const positiva = variacion >= 0;
    const muyPositiva = variacion >= 5;
    const muyNegativa = variacion <= -5;

    const color = muyPositiva
        ? 'text-neon-green'
        : muyNegativa
            ? 'text-error'
            : 'text-neon-orange';

    const icono = positiva ? 'trending_up' : 'trending_down';
    const signo = positiva ? '+' : '';

    return (
        <div className="mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
                <span className={cn('material-symbols-outlined text-base', color)}>
                    {icono}
                </span>
                <span className={cn('font-headline text-base font-bold', color)}>
                    {signo}
                    {variacion.toFixed(1)}%
                </span>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-1">
                vs media histórica · {formatearMoneda(media)}
            </p>
        </div>
    );
}
