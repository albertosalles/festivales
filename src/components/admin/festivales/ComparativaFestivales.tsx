import type { Festival, ResumenFestival } from '@/lib/tipos';
import { formatearMoneda } from '@/lib/utils';

interface Props {
    festivales: Festival[];
    resumenes: ResumenFestival[];
}

interface Metrica {
    clave: keyof ResumenFestival;
    etiqueta: string;
    icono: string;
    formato: (n: number) => string;
    color: 'neon-green' | 'neon-blue' | 'neon-orange';
}

const METRICAS: Metrica[] = [
    { clave: 'recaudacionTotal', etiqueta: 'Recaudación', icono: 'payments', formato: formatearMoneda, color: 'neon-green' },
    { clave: 'totalAsistentes', etiqueta: 'Asistentes', icono: 'group', formato: (n) => n.toLocaleString('es-ES'), color: 'neon-blue' },
    { clave: 'totalTransacciones', etiqueta: 'Transacciones', icono: 'receipt_long', formato: (n) => n.toLocaleString('es-ES'), color: 'neon-blue' },
    { clave: 'ticketMedio', etiqueta: 'Ticket medio', icono: 'confirmation_number', formato: formatearMoneda, color: 'neon-orange' },
    { clave: 'eficienciaEurosHora', etiqueta: 'Eficiencia €/h', icono: 'bolt', formato: (n) => `${n.toFixed(2)} €/h`, color: 'neon-orange' },
    { clave: 'totalIncidencias', etiqueta: 'Incidencias', icono: 'warning', formato: (n) => n.toLocaleString('es-ES'), color: 'neon-orange' },
];

const COLOR_BG = {
    'neon-green': 'bg-neon-green/10',
    'neon-blue': 'bg-neon-blue/10',
    'neon-orange': 'bg-neon-orange/10',
} as const;
const COLOR_TEXT = {
    'neon-green': 'text-neon-green',
    'neon-blue': 'text-neon-blue',
    'neon-orange': 'text-neon-orange',
} as const;
const COLOR_GRADIENT = {
    'neon-green': 'from-neon-green/60 to-neon-green',
    'neon-blue': 'from-neon-blue/60 to-neon-blue',
    'neon-orange': 'from-neon-orange/60 to-neon-orange',
} as const;

/**
 * Comparativa entre ediciones — 3 formatos visuales:
 * 1. Tarjetas "winner" (qué edición lidera cada métrica)
 * 2. Gráfico de barras agrupadas (recaudación visual)
 * 3. Tabla comparativa completa
 */
export function ComparativaFestivales({ festivales, resumenes }: Props) {
    if (resumenes.length === 0) {
        return (
            <section className="bg-surface-container-low rounded-xl p-8 border border-dashed border-white/10 text-center">
                <span className="material-symbols-outlined text-on-surface-variant/50 text-5xl mb-3">
                    insights
                </span>
                <h4 className="font-headline text-xl font-bold text-on-surface mb-2">
                    Comparativa entre ediciones
                </h4>
                <p className="text-sm text-on-surface-variant max-w-md mx-auto">
                    Aún no hay resúmenes generados. Cuando generes el resumen de un festival,
                    aparecerá aquí la comparativa con el resto de ediciones.
                </p>
            </section>
        );
    }

    const nombrePorId = new Map(festivales.map((f) => [f.idFestival, f.nombre]));

    // Pre-cálculo de líderes por métrica
    const lideres = METRICAS.map((m) => {
        const valores = resumenes.map((r) => ({
            id: r.idFestival,
            valor: Number(r[m.clave]),
        }));
        // Para incidencias, "ganar" = tener menos
        const esMenorMejor = m.clave === 'totalIncidencias';
        const ordenados = [...valores].sort((a, b) =>
            esMenorMejor ? a.valor - b.valor : b.valor - a.valor,
        );
        return { metrica: m, lider: ordenados[0], esMenorMejor };
    });

    // Para el gráfico: máximo absoluto de recaudación
    const maxRecaudacion = Math.max(...resumenes.map((r) => r.recaudacionTotal), 1);

    return (
        <section>
            <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-neon-green text-3xl">insights</span>
                <div>
                    <h2 className="font-headline text-3xl font-bold text-on-surface">
                        Comparativa entre ediciones
                    </h2>
                    <p className="text-xs text-on-surface-variant uppercase tracking-widest">
                        {resumenes.length} {resumenes.length === 1 ? 'edición' : 'ediciones'} con resumen
                    </p>
                </div>
            </div>

            {/* === Tarjetas "winner" === */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                {lideres.map(({ metrica, lider, esMenorMejor }) => (
                    <div
                        key={metrica.clave}
                        className="bg-surface-container rounded-xl p-5 relative overflow-hidden group"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <span className={`material-symbols-outlined ${COLOR_TEXT[metrica.color]} group-hover:scale-110 transition-transform`}>
                                {metrica.icono}
                            </span>
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${COLOR_BG[metrica.color]} ${COLOR_TEXT[metrica.color]} px-2 py-0.5 rounded-full`}>
                                {esMenorMejor ? 'Menos' : 'Más'}
                            </span>
                        </div>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">
                            {metrica.etiqueta}
                        </p>
                        <p className={`font-headline text-2xl font-bold ${COLOR_TEXT[metrica.color]}`}>
                            {metrica.formato(lider.valor)}
                        </p>
                        <p className="text-[11px] text-on-surface-variant mt-1.5 truncate">
                            {nombrePorId.get(lider.id) ?? `#${lider.id}`}
                        </p>
                    </div>
                ))}
            </div>

            {/* === Gráfico de barras agrupadas === */}
            <div className="bg-surface-container rounded-xl p-8 mb-10 relative overflow-hidden">
                <h3 className="font-headline text-xl font-bold text-on-surface mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-neon-green">bar_chart</span>
                    Recaudación por edición
                </h3>
                <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-6">
                    Eje horizontal proporcional al máximo de la serie
                </p>

                <div className="space-y-4">
                    {resumenes.map((r) => {
                        const pct = (r.recaudacionTotal / maxRecaudacion) * 100;
                        const nombre = nombrePorId.get(r.idFestival) ?? `Festival #${r.idFestival}`;
                        return (
                            <div key={r.idFestival}>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="font-bold text-on-surface">{nombre}</span>
                                    <div className="flex gap-3 text-on-surface-variant">
                                        <span>
                                            {r.eficienciaEurosHora.toFixed(1)} €/h
                                        </span>
                                        <span className="text-neon-green font-headline font-bold">
                                            {formatearMoneda(r.recaudacionTotal)}
                                        </span>
                                    </div>
                                </div>
                                <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-gradient-to-r ${COLOR_GRADIENT['neon-green']} rounded-full shadow-[0_0_15px_rgba(186,253,0,0.3)]`}
                                        style={{ width: `${Math.max(pct, 2)}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-neon-green/5 rounded-full blur-[80px]" />
            </div>

            {/* === Tabla comparativa === */}
            <div className="bg-surface-container-low rounded-xl p-6 border border-white/5 overflow-x-auto">
                <h3 className="font-headline text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-neon-blue">table_chart</span>
                    Detalle completo
                </h3>
                <table className="w-full text-sm min-w-[640px]">
                    <thead>
                        <tr className="text-[10px] uppercase tracking-widest text-on-surface-variant border-b border-white/5">
                            <th className="text-left pb-3 font-medium">Edición</th>
                            {METRICAS.map((m) => (
                                <th key={m.clave} className="text-right pb-3 font-medium pl-3">
                                    {m.etiqueta}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {resumenes.map((r) => {
                            const nombre = nombrePorId.get(r.idFestival) ?? `Festival #${r.idFestival}`;
                            return (
                                <tr key={r.idFestival} className="border-b border-white/5 last:border-0">
                                    <td className="py-3 font-bold text-on-surface">{nombre}</td>
                                    {METRICAS.map((m) => {
                                        const valor = Number(r[m.clave]);
                                        const esLider = lideres.find((l) => l.metrica.clave === m.clave)?.lider.id === r.idFestival;
                                        return (
                                            <td key={m.clave} className="py-3 text-right pl-3 tabular-nums">
                                                <span className={esLider ? `font-bold ${COLOR_TEXT[m.color]}` : 'text-on-surface-variant'}>
                                                    {m.formato(valor)}
                                                </span>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
