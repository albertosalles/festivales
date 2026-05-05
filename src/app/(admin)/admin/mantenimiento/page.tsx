import Link from 'next/link';
import {
    obtenerDatosMantenimiento,
    formatearBytes,
} from '@/servicios/mantenimiento.servicio';
import {
    obtenerTodosFestivales,
    obtenerResumenesFestivales,
} from '@/servicios/festivales.servicio';
import { formatearMoneda } from '@/lib/utils';
import { RUTAS } from '@/lib/constantes';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Panel de Mantenimiento — Salud de la BD.
 * Datos servidos por la HTTP API de Grafana (datasource Postgres).
 */
export default async function PaginaMantenimiento() {
    let datos: Awaited<ReturnType<typeof obtenerDatosMantenimiento>> | null = null;
    let error: string | null = null;

    try {
        datos = await obtenerDatosMantenimiento();
    } catch (e) {
        error = e instanceof Error ? e.message : 'Error desconocido';
    }

    // Datos de festivales (no bloquean la página si fallan)
    const [festivales, resumenes] = await Promise.all([
        obtenerTodosFestivales().catch(() => []),
        obtenerResumenesFestivales().catch(() => []),
    ]);
    const festivalActivo = festivales.find((f) => f.activo);
    const festivalesFinalizados = festivales.filter((f) => !f.activo);

    if (error || !datos) {
        return (
            <div>
                <HeroMantenimiento estado="error" />
                <div className="bg-error/10 border border-error/30 rounded-xl p-6 mt-8 mb-10">
                    <p className="text-error font-bold text-sm uppercase tracking-widest mb-2">
                        No se pudo conectar con Grafana
                    </p>
                    <p className="text-on-surface-variant text-sm font-mono">{error}</p>
                    <p className="text-on-surface-variant text-xs mt-3">
                        Las métricas de salud de BD no están disponibles ahora mismo.
                        El resto de la gestión sigue operativa.
                    </p>
                </div>
                <SeccionHistorico
                    festivalActivo={festivalActivo}
                    festivales={festivales}
                    festivalesFinalizados={festivalesFinalizados}
                    resumenes={resumenes}
                />
            </div>
        );
    }

    const { kpis, tamanoPorTabla, actividadPorTabla, tablasVacuum, indicesNoUsados, queriesLentas, transaccionesPorHora } = datos;
    const maxBytes = Math.max(...tamanoPorTabla.map((t) => t.bytes), 1);
    const maxTx = Math.max(...transaccionesPorHora.map((t) => t.total), 1);
    const maxActividad = Math.max(
        ...actividadPorTabla.map((a) => a.inserts + a.updates + a.deletes),
        1,
    );
    const cacheOk = kpis.cacheHitRatio >= 99;

    return (
        <div>
            <HeroMantenimiento estado="ok" />

            {/* === KPIs salud BD === */}
            <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-10">
                <TarjetaKpi
                    icono="database"
                    color="neon-green"
                    etiqueta="Tamaño BD"
                    valor={kpis.tamanoBd}
                    glow
                />
                <TarjetaKpi
                    icono="cable"
                    color="neon-blue"
                    etiqueta="Conexiones activas"
                    valor={kpis.conexionesActivas.toString()}
                    badge="LIVE"
                />
                <TarjetaKpi
                    icono="speed"
                    color={cacheOk ? 'neon-green' : 'neon-orange'}
                    etiqueta="Cache Hit Ratio"
                    valor={`${kpis.cacheHitRatio.toFixed(2)}%`}
                    pie={cacheOk ? 'Objetivo cumplido' : 'Por debajo del 99%'}
                />
                <TarjetaKpi
                    icono="group"
                    color="neon-blue"
                    etiqueta="Usuarios"
                    valor={kpis.usuariosRegistrados.toLocaleString('es-ES')}
                />
                <TarjetaKpi
                    icono="receipt_long"
                    color="neon-blue"
                    etiqueta="Transacciones"
                    valor={kpis.totalTransacciones.toLocaleString('es-ES')}
                />
                <TarjetaKpi
                    icono="account_balance_wallet"
                    color="neon-green"
                    etiqueta="Saldo wallets"
                    valor={formatearMoneda(kpis.saldoTotalWallets)}
                />
            </section>

            {/* === Estado operativo (incidencias + camareros) === */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <TarjetaKpi
                    icono="warning"
                    color={kpis.incidenciasPendientes > 0 ? 'error' : 'neon-green'}
                    etiqueta="Incidencias pendientes"
                    valor={kpis.incidenciasPendientes.toString()}
                />
                <TarjetaKpi
                    icono="task_alt"
                    color="neon-green"
                    etiqueta="Incidencias resueltas"
                    valor={kpis.incidenciasResueltas.toString()}
                />
                <TarjetaKpi
                    icono="badge"
                    color="neon-blue"
                    etiqueta="Camareros activos"
                    valor={kpis.camarerosActivos.toString()}
                />
            </section>

            {/* === Almacenamiento === */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10">
                {/* Tamaño por tabla */}
                <div className="lg:col-span-7 bg-surface-container rounded-xl p-8 relative overflow-hidden">
                    <div className="relative z-10">
                        <h4 className="font-headline text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-neon-green">storage</span>
                            Tamaño por tabla
                            <span className="text-[10px] font-normal tracking-widest uppercase bg-surface-container-high px-2 py-1 rounded ml-auto">
                                Bytes totales
                            </span>
                        </h4>
                        <div className="space-y-3">
                            {tamanoPorTabla.length === 0 ? (
                                <p className="text-on-surface-variant text-sm text-center py-8 italic">
                                    Sin datos
                                </p>
                            ) : (
                                tamanoPorTabla.map((t) => (
                                    <div key={t.tabla}>
                                        <div className="flex justify-between text-xs mb-1.5 px-1">
                                            <span className="font-bold font-mono">{t.tabla}</span>
                                            <span className="text-neon-green font-headline font-bold">
                                                {formatearBytes(t.bytes)}
                                            </span>
                                        </div>
                                        <div className="h-2.5 w-full bg-surface-container-high rounded-full relative overflow-hidden">
                                            <div
                                                className="absolute h-full bg-gradient-to-r from-neon-green/60 to-neon-green rounded-full shadow-[0_0_10px_rgba(186,253,0,0.3)]"
                                                style={{ width: `${Math.max((t.bytes / maxBytes) * 100, 3)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-neon-green/5 rounded-full blur-[80px]" />
                </div>

                {/* VACUUM */}
                <div className="lg:col-span-5 bg-surface-container-low rounded-xl p-8 border border-white/5">
                    <h4 className="font-headline text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-neon-orange">cleaning_services</span>
                        VACUUM recomendado
                    </h4>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter mb-4">
                        % de filas muertas (bloat) por tabla
                    </p>
                    <div className="space-y-2">
                        {tablasVacuum.length === 0 ? (
                            <p className="text-on-surface-variant text-sm italic">Sin datos</p>
                        ) : (
                            tablasVacuum.slice(0, 8).map((t) => {
                                const bloat = t.pctBloat ?? 0;
                                const color =
                                    bloat > 20 ? 'text-error' : bloat > 10 ? 'text-neon-orange' : 'text-neon-green';
                                return (
                                    <div
                                        key={t.tabla}
                                        className="flex items-center justify-between bg-surface-container rounded-lg px-3 py-2"
                                    >
                                        <span className="font-mono text-xs text-on-surface">{t.tabla}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] text-on-surface-variant">
                                                {t.filasMuertas.toLocaleString('es-ES')} / {(t.filasVivas + t.filasMuertas).toLocaleString('es-ES')}
                                            </span>
                                            <span className={`font-headline font-bold text-sm ${color}`}>
                                                {bloat.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* === Actividad === */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10">
                {/* Actividad por tabla */}
                <div className="lg:col-span-7 bg-surface-container rounded-xl p-8">
                    <h4 className="font-headline text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-neon-blue">bar_chart</span>
                        Actividad por tabla
                        <span className="text-[10px] font-normal tracking-widest uppercase bg-surface-container-high px-2 py-1 rounded ml-auto">
                            Inserts · Updates · Deletes
                        </span>
                    </h4>
                    <div className="space-y-4">
                        {actividadPorTabla.map((a) => {
                            const total = a.inserts + a.updates + a.deletes || 1;
                            const widthPct = (total / maxActividad) * 100;
                            return (
                                <div key={a.tabla}>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="font-mono font-bold">{a.tabla}</span>
                                        <span className="text-on-surface-variant">
                                            {(a.inserts + a.updates + a.deletes).toLocaleString('es-ES')} ops
                                        </span>
                                    </div>
                                    <div
                                        className="flex h-3 rounded-full overflow-hidden bg-surface-container-high"
                                        style={{ width: `${Math.max(widthPct, 5)}%` }}
                                    >
                                        <div
                                            className="bg-neon-green"
                                            style={{ width: `${(a.inserts / total) * 100}%` }}
                                            title={`Inserts: ${a.inserts}`}
                                        />
                                        <div
                                            className="bg-neon-blue"
                                            style={{ width: `${(a.updates / total) * 100}%` }}
                                            title={`Updates: ${a.updates}`}
                                        />
                                        <div
                                            className="bg-error"
                                            style={{ width: `${(a.deletes / total) * 100}%` }}
                                            title={`Deletes: ${a.deletes}`}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex gap-4 mt-6 text-[10px] uppercase tracking-widest text-on-surface-variant">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-neon-green rounded-full" /> Inserts
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-neon-blue rounded-full" /> Updates
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-error rounded-full" /> Deletes
                        </span>
                    </div>
                </div>

                {/* Transacciones por hora */}
                <div className="lg:col-span-5 bg-surface-container rounded-xl p-8 relative overflow-hidden">
                    <h4 className="font-headline text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-neon-blue">timeline</span>
                        Transacciones / hora
                        <span className="text-[10px] font-normal tracking-widest uppercase bg-surface-container-high px-2 py-1 rounded ml-auto">
                            Últimas 24h
                        </span>
                    </h4>
                    {transaccionesPorHora.length === 0 ? (
                        <p className="text-on-surface-variant text-sm text-center py-12 italic">
                            Sin transacciones en las últimas 24h
                        </p>
                    ) : (
                        <div className="flex items-end gap-1 h-44 pt-4">
                            {transaccionesPorHora.map((t) => {
                                const pct = Math.max((t.total / maxTx) * 100, 4);
                                const horaCorta = t.hora.slice(11, 13) + 'h';
                                return (
                                    <div key={t.hora} className="flex-1 flex flex-col items-center justify-end h-full group">
                                        <span className="text-[10px] text-neon-blue font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {t.total}
                                        </span>
                                        <div
                                            className="w-full rounded-t-sm bg-gradient-to-t from-neon-blue/20 to-neon-blue group-hover:brightness-125 transition-all"
                                            style={{ height: `${pct}%` }}
                                        />
                                        <span className="text-[9px] text-on-surface-variant mt-2 font-medium">
                                            {horaCorta}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-neon-blue/5 rounded-full blur-[60px]" />
                </div>
            </div>

            {/* === Rendimiento (queries lentas + índices) === */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10">
                {/* Queries más lentas */}
                <div className="lg:col-span-7 bg-surface-container rounded-xl p-8">
                    <h4 className="font-headline text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-neon-orange">timer</span>
                        Queries más lentas
                    </h4>
                    {queriesLentas.length === 0 ? (
                        <p className="text-on-surface-variant text-sm italic py-8 text-center">
                            Sin datos de pg_stat_statements
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-white/5">
                                        <th className="text-left pb-3 font-medium">Query</th>
                                        <th className="text-right pb-3 font-medium">Llamadas</th>
                                        <th className="text-right pb-3 font-medium">Media</th>
                                        <th className="text-right pb-3 font-medium">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {queriesLentas.map((q, i) => (
                                        <tr key={i} className="border-b border-white/5 last:border-0">
                                            <td className="py-2.5 font-mono text-[11px] text-on-surface truncate max-w-[260px]">
                                                {q.query}
                                            </td>
                                            <td className="py-2.5 text-right text-on-surface-variant">
                                                {q.llamadas.toLocaleString('es-ES')}
                                            </td>
                                            <td className="py-2.5 text-right text-neon-orange font-bold">
                                                {q.mediaMs.toFixed(2)} ms
                                            </td>
                                            <td className="py-2.5 text-right text-on-surface-variant">
                                                {q.totalMs.toFixed(0)} ms
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Índices no usados */}
                <div className="lg:col-span-5 bg-surface-container-low rounded-xl p-8 border border-white/5">
                    <h4 className="font-headline text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-error">data_alert</span>
                        Índices no utilizados
                    </h4>
                    {indicesNoUsados.length === 0 ? (
                        <p className="text-neon-green text-sm py-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">check_circle</span>
                            Todos los índices están en uso
                        </p>
                    ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto">
                            {indicesNoUsados.map((idx) => (
                                <div
                                    key={`${idx.tabla}.${idx.indice}`}
                                    className="bg-surface-container rounded-lg px-3 py-2"
                                >
                                    <p className="font-mono text-[11px] text-on-surface">{idx.indice}</p>
                                    <p className="text-[10px] text-on-surface-variant mt-0.5">en {idx.tabla}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* === Histórico y gestión multi-festival === */}
            <SeccionHistorico
                festivalActivo={festivalActivo}
                festivales={festivales}
                festivalesFinalizados={festivalesFinalizados}
                resumenes={resumenes}
            />
        </div>
    );
}

/** Sección de histórico/multi-festival. Visible siempre, incluso si Grafana falla. */
function SeccionHistorico({
    festivalActivo,
    festivales,
    festivalesFinalizados,
    resumenes,
}: {
    festivalActivo: { nombre: string; ubicacion?: string } | undefined;
    festivales: { idFestival: number }[];
    festivalesFinalizados: { idFestival: number }[];
    resumenes: { idFestival: number }[];
}) {
    return (
        <section className="bg-surface-container-low rounded-xl p-8 border border-white/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                    <span className="text-neon-orange font-bold text-xs tracking-widest uppercase mb-2 block">
                        Histórico y multi-festival
                    </span>
                    <h4 className="font-headline text-2xl font-bold text-on-surface">
                        Gestión de ediciones
                    </h4>
                </div>
                <span className="material-symbols-outlined text-neon-orange/60 text-4xl shrink-0">
                    history
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 relative z-10">
                <div className="bg-surface-container rounded-xl p-5">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">
                        Edición activa
                    </p>
                    <p className="font-headline text-xl font-bold text-neon-green truncate">
                        {festivalActivo?.nombre ?? 'Ninguna'}
                    </p>
                    {festivalActivo?.ubicacion && (
                        <p className="text-[11px] text-on-surface-variant mt-1">{festivalActivo.ubicacion}</p>
                    )}
                </div>
                <div className="bg-surface-container rounded-xl p-5">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">
                        Total ediciones
                    </p>
                    <p className="font-headline text-xl font-bold text-on-surface">
                        {festivales.length}
                    </p>
                    <p className="text-[11px] text-on-surface-variant mt-1">
                        {festivalesFinalizados.length} finalizadas
                    </p>
                </div>
                <div className="bg-surface-container rounded-xl p-5">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">
                        Resúmenes generados
                    </p>
                    <p className="font-headline text-xl font-bold text-on-surface">
                        {resumenes.length}
                    </p>
                    <p className="text-[11px] text-on-surface-variant mt-1">
                        Listos para comparativa
                    </p>
                </div>
            </div>

            <Link
                href={RUTAS.ADMIN_FESTIVALES}
                className="inline-flex items-center gap-2 bg-neon-orange/10 text-neon-orange hover:bg-neon-orange/20 transition-colors text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-lg relative z-10"
            >
                <span className="material-symbols-outlined text-base">event</span>
                Ir al panel de festivales
                <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>

            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-neon-orange/5 rounded-full blur-[60px]" />
        </section>
    );
}

/** Hero header del panel — mismo lenguaje visual que el dashboard. */
function HeroMantenimiento({ estado }: { estado: 'ok' | 'error' }) {
    return (
        <section className="mb-12">
            <div className="flex justify-between items-end">
                <div>
                    <span className="text-neon-blue font-bold text-xs tracking-widest uppercase mb-2 block">
                        Database Health
                    </span>
                    <h1 className="font-headline text-6xl font-black tracking-tighter text-on-surface">
                        Panel de <span className="text-neon-green italic">Mantenimiento</span>.
                    </h1>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mt-1">
                        <span
                            className={`w-2 h-2 rounded-full animate-pulse ${
                                estado === 'ok'
                                    ? 'bg-neon-green shadow-[0_0_8px_#e9ffba]'
                                    : 'bg-error shadow-[0_0_8px_#ff6e84]'
                            }`}
                        />
                        <span
                            className={`text-[10px] font-bold uppercase tracking-tighter ${
                                estado === 'ok' ? 'text-neon-green' : 'text-error'
                            }`}
                        >
                            {estado === 'ok' ? 'Grafana Conectado' : 'Sin conexión'}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}

/** Mapeo color → clases Tailwind estáticas (necesario para que el JIT las incluya). */
const CLASES_COLOR_KPI = {
    'neon-green': {
        texto: 'text-neon-green',
        fondoSuave: 'bg-neon-green/10',
    },
    'neon-blue': {
        texto: 'text-neon-blue',
        fondoSuave: 'bg-neon-blue/10',
    },
    'neon-orange': {
        texto: 'text-neon-orange',
        fondoSuave: 'bg-neon-orange/10',
    },
    error: {
        texto: 'text-error',
        fondoSuave: 'bg-error/10',
    },
} as const;

/** Tarjeta KPI reutilizable con la estética del bento del dashboard. */
function TarjetaKpi({
    icono,
    color,
    etiqueta,
    valor,
    badge,
    pie,
    glow,
}: {
    icono: string;
    color: keyof typeof CLASES_COLOR_KPI;
    etiqueta: string;
    valor: string;
    badge?: string;
    pie?: string;
    glow?: boolean;
}) {
    const c = CLASES_COLOR_KPI[color];
    const glowClass = glow ? 'shadow-[0_0_20px_rgba(233,255,186,0.15)]' : '';
    return (
        <div className={`bg-surface-container p-6 rounded-xl group ${glowClass}`}>
            <div className="flex justify-between items-start mb-4">
                <span className={`material-symbols-outlined ${c.texto} group-hover:scale-110 transition-transform`}>
                    {icono}
                </span>
                {badge && (
                    <span className={`text-[10px] font-bold ${c.texto} ${c.fondoSuave} px-2 py-0.5 rounded-full`}>
                        {badge}
                    </span>
                )}
            </div>
            <p className="text-on-surface-variant text-xs font-medium uppercase tracking-widest mb-1">
                {etiqueta}
            </p>
            <h3 className="font-headline text-[1.5rem] font-bold text-on-surface break-all">
                {valor}
            </h3>
            {pie && (
                <p className={`text-[10px] mt-2 uppercase tracking-wider ${c.texto}`}>{pie}</p>
            )}
        </div>
    );
}
