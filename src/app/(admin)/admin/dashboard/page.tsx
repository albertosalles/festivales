import { obtenerMetricasGlobales, obtenerIngresosPorBarra } from '@/servicios/metricas.servicio';
import { obtenerBarras } from '@/servicios/barras.servicio';
import { obtenerCamareros } from '@/servicios/camareros.servicio';

/**
 * Dashboard Global — Panel Admin.
 * Diseño Stitch "Pulse Live" con KPIs reales.
 */
export default async function PaginaDashboard() {
    const [metricas, ingresosPorBarra, barras, camareros] = await Promise.all([
        obtenerMetricasGlobales(),
        obtenerIngresosPorBarra(),
        obtenerBarras(),
        obtenerCamareros(),
    ]);

    const barrasAlta = barras.filter((b) => b.estadoCola === 'alta').length;
    const barrasMedia = barras.filter((b) => b.estadoCola === 'media').length;
    const barrasBaja = barras.filter((b) => b.estadoCola === 'baja').length;
    const maxIngreso = Math.max(...ingresosPorBarra.map((b) => b.ingresos), 1);
    const camarerosActivos = camareros.filter((c) => c.activo).length;

    return (
        <div>
            {/* Hero Header */}
            <section className="mb-12">
                <div className="flex justify-between items-end">
                    <div>
                        <span className="text-neon-blue font-bold text-xs tracking-widest uppercase mb-2 block">
                            Live Status
                        </span>
                        <h1 className="font-headline text-6xl font-black tracking-tighter text-on-surface">
                            Pulse <span className="text-neon-green italic">Live</span>.
                        </h1>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-2 justify-end mt-1">
                            <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse shadow-[0_0_8px_#e9ffba]" />
                            <span className="text-[10px] font-bold uppercase tracking-tighter text-neon-green">
                                System Online
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* KPI Bento Grid */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                {/* Recaudación */}
                <div className="bg-surface-container p-6 rounded-xl shadow-[0_0_20px_rgba(233,255,186,0.15)] group">
                    <div className="flex justify-between items-start mb-4">
                        <span className="material-symbols-outlined text-neon-green group-hover:scale-110 transition-transform">
                            payments
                        </span>
                    </div>
                    <p className="text-on-surface-variant text-xs font-medium uppercase tracking-widest mb-1">
                        Recaudación Total
                    </p>
                    <h3 className="font-headline text-3xl font-bold text-on-surface">
                        €{metricas.ingresosTotales.toFixed(2)}
                    </h3>
                    <div className="mt-4 h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div className="h-full bg-neon-green w-[75%] rounded-full" />
                    </div>
                </div>

                {/* Transacciones */}
                <div className="bg-surface-container p-6 rounded-xl group">
                    <div className="flex justify-between items-start mb-4">
                        <span className="material-symbols-outlined text-neon-blue group-hover:scale-110 transition-transform">
                            receipt_long
                        </span>
                        <span className="text-[10px] font-bold text-neon-blue bg-neon-blue/10 px-2 py-0.5 rounded-full">
                            LIVE
                        </span>
                    </div>
                    <p className="text-on-surface-variant text-xs font-medium uppercase tracking-widest mb-1">
                        Transacciones
                    </p>
                    <h3 className="font-headline text-3xl font-bold text-on-surface">
                        {metricas.totalTransacciones}
                    </h3>
                </div>

                {/* Ticket Medio */}
                <div className="bg-surface-container p-6 rounded-xl group">
                    <div className="flex justify-between items-start mb-4">
                        <span className="material-symbols-outlined text-neon-orange group-hover:scale-110 transition-transform">
                            confirmation_number
                        </span>
                    </div>
                    <p className="text-on-surface-variant text-xs font-medium uppercase tracking-widest mb-1">
                        Ticket Medio
                    </p>
                    <h3 className="font-headline text-3xl font-bold text-on-surface">
                        €{metricas.ticketMedio.toFixed(2)}
                    </h3>
                </div>

                {/* Estado Colas */}
                <div className="bg-surface-container p-6 rounded-xl group">
                    <div className="flex justify-between items-start mb-4">
                        <span className="material-symbols-outlined text-on-surface group-hover:scale-110 transition-transform">
                            speed
                        </span>
                    </div>
                    <p className="text-on-surface-variant text-xs font-medium uppercase tracking-widest mb-1">
                        Estado Colas
                    </p>
                    <div className="flex gap-1 mt-2">
                        {Array.from({ length: barrasBaja }).map((_, i) => (
                            <div key={`b${i}`} className="h-1.5 flex-1 bg-neon-green rounded-full" />
                        ))}
                        {Array.from({ length: barrasMedia }).map((_, i) => (
                            <div key={`m${i}`} className="h-1.5 flex-1 bg-neon-orange rounded-full shadow-[0_0_10px_#ff7439]" />
                        ))}
                        {Array.from({ length: barrasAlta }).map((_, i) => (
                            <div key={`a${i}`} className="h-1.5 flex-1 bg-error rounded-full shadow-[0_0_10px_#ff6e84]" />
                        ))}
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-3 uppercase tracking-wider">
                        {barrasBaja} baja · {barrasMedia} media · {barrasAlta} alta
                    </p>
                </div>
            </section>

            {/* Rendimiento de Barras */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 bg-surface-container rounded-xl p-8 relative overflow-hidden">
                    <div className="relative z-10">
                        <h4 className="font-headline text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
                            Rendimiento de Barras
                            <span className="text-[10px] font-normal tracking-widest uppercase bg-surface-container-high px-2 py-1 rounded">
                                Real-time stats
                            </span>
                        </h4>
                        <div className="space-y-4">
                            {ingresosPorBarra.map((barra) => (
                                <div key={barra.idBarra} className="relative">
                                    <div className="flex justify-between text-xs mb-2 px-1">
                                        <span className="font-bold">{barra.nombreBarra}</span>
                                        <span className="text-neon-green">€{barra.ingresos.toFixed(2)}</span>
                                    </div>
                                    <div className="h-4 w-full bg-surface-container-high rounded-full relative">
                                        <div
                                            className="absolute h-full bg-gradient-to-r from-neon-green to-neon-green-container rounded-full shadow-[0_0_15px_rgba(186,253,0,0.3)]"
                                            style={{ width: `${Math.max((barra.ingresos / maxIngreso) * 100, 2)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {ingresosPorBarra.length === 0 && (
                                <p className="text-on-surface-variant text-sm text-center py-8">
                                    No hay transacciones registradas todavía
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-neon-green/5 rounded-full blur-[80px]" />
                </div>

                {/* Panel derecho — Resumen de personal */}
                <div className="lg:col-span-5 bg-surface-container-low rounded-xl p-8 border border-white/5">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h4 className="font-headline text-xl font-bold text-on-surface">
                                Equipo Activo
                            </h4>
                            <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-tighter">
                                Personal en servicio
                            </p>
                        </div>
                        <span className="material-symbols-outlined text-neon-blue">group</span>
                    </div>
                    <div className="space-y-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-on-surface-variant text-xs uppercase tracking-widest mb-1">
                                    Camareros Activos
                                </p>
                                <h3 className="font-headline text-4xl font-bold text-on-surface">
                                    {camarerosActivos}
                                    <span className="text-sm text-on-surface-variant font-normal">
                                        /{camareros.length}
                                    </span>
                                </h3>
                            </div>
                            <div
                                className="w-16 h-16 rounded-full border-4 border-neon-green flex items-center justify-center"
                                style={{
                                    background: `conic-gradient(#bafd00 ${camareros.length > 0 ? (camarerosActivos / camareros.length) * 100 : 0}%, #19191d 0)`
                                }}
                            >
                                <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center">
                                    <span className="text-xs font-bold text-neon-green">
                                        {camareros.length > 0 ? Math.round((camarerosActivos / camareros.length) * 100) : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-surface-container rounded-xl">
                            <span className="material-symbols-outlined text-neon-green">local_bar</span>
                            <div>
                                <p className="text-xs font-bold text-on-surface">Total Barras</p>
                                <p className="text-[10px] text-on-surface-variant">{barras.length} puntos de venta activos</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
