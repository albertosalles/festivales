import Link from 'next/link';
import { obtenerBarraPorId } from '@/servicios/barras.servicio';
import { obtenerMetricasBarra } from '@/servicios/metricas.servicio';
import { obtenerCamarerosPorBarra, obtenerHistorialCamarerosPorBarra } from '@/servicios/camareros.servicio';
import { obtenerProductosPorBarra } from '@/servicios/productos.servicio';
import { RUTAS } from '@/lib/constantes';
import { cn } from '@/lib/utils';
import {
    COLOR_TEXTO_POR_ESTADO,
    COLOR_FONDO_ICONO_POR_ESTADO,
    BADGE_ESTADO,
} from '@/lib/constantes';
import { notFound } from 'next/navigation';

/**
 * Detalle de una barra — Panel Admin.
 * Métricas, camareros asignados, productos, ingresos.
 */
export default async function PaginaDetalleBarra({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const idBarra = Number(id);

    if (!idBarra || isNaN(idBarra)) return notFound();

    const [barra, metricas, camarerosActivos, productos, historialCamareros] = await Promise.all([
        obtenerBarraPorId(idBarra),
        obtenerMetricasBarra(idBarra),
        obtenerCamarerosPorBarra(idBarra),
        obtenerProductosPorBarra(idBarra),
        obtenerHistorialCamarerosPorBarra(idBarra),
    ]);

    if (!barra) return notFound();

    return (
        <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-6 text-on-surface-variant text-xs uppercase tracking-widest">
                <Link
                    href={RUTAS.ADMIN_BARRAS}
                    className="hover:text-neon-green transition-colors flex items-center gap-1"
                >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Volver al panel
                </Link>
                <span>·</span>
                <span>Control de Barras</span>
                <span>·</span>
                <span className="text-on-surface font-bold">
                    Detalle de barra: {barra.nombreLocalizacion}
                </span>
            </div>

            {/* Hero */}
            <section className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="font-headline text-5xl font-black italic tracking-tighter text-on-surface uppercase">
                        {barra.nombreLocalizacion}
                    </h1>
                    <p className="text-on-surface-variant font-medium text-sm mt-2">
                        Informe de rendimiento en tiempo real.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <span
                        className={cn(
                            'px-4 py-2 text-xs font-black uppercase tracking-widest rounded-full',
                            COLOR_FONDO_ICONO_POR_ESTADO[barra.estadoCola],
                            COLOR_TEXTO_POR_ESTADO[barra.estadoCola]
                        )}
                    >
                        {BADGE_ESTADO[barra.estadoCola]}
                    </span>
                </div>
            </section>

            {/* KPI Row */}
            <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-10">
                <div className="bg-surface-container p-6 rounded-xl shadow-[0_0_20px_rgba(233,255,186,0.1)] group">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-neon-green text-sm">payments</span>
                        <span className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">
                            Ingresos Totales
                        </span>
                    </div>
                    <h3 className="font-headline text-3xl font-bold text-on-surface">
                        €{metricas.ingresosTotales.toFixed(2)}
                    </h3>
                </div>

                <div className="bg-surface-container p-6 rounded-xl group">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-neon-blue text-sm">receipt_long</span>
                        <span className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">
                            Transacciones
                        </span>
                    </div>
                    <h3 className="font-headline text-3xl font-bold text-on-surface">
                        {metricas.totalTransacciones}
                    </h3>
                </div>

                <div className="bg-surface-container p-6 rounded-xl group">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-neon-orange text-sm">confirmation_number</span>
                        <span className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">
                            Ticket Medio
                        </span>
                    </div>
                    <h3 className="font-headline text-3xl font-bold text-on-surface">
                        €{metricas.ticketMedio.toFixed(2)}
                    </h3>
                </div>

                <div className="bg-surface-container p-6 rounded-xl group">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-neon-green text-sm">inventory_2</span>
                        <span className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">
                            Uds. Vendidas
                        </span>
                    </div>
                    <h3 className="font-headline text-3xl font-bold text-on-surface">
                        {metricas.unidadesTotalesVendidas}
                    </h3>
                </div>

                <div className="bg-surface-container p-6 rounded-xl group">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-neon-blue text-sm">schedule</span>
                        <span className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">
                            Hora Pico
                        </span>
                    </div>
                    <h3 className="font-headline text-3xl font-bold text-on-surface">
                        {metricas.horaPico ?? '—'}
                    </h3>
                    {metricas.horaPico && (
                        <p className="text-[10px] text-on-surface-variant mt-1">
                            {metricas.horaPicoVolumen} pedidos en esa franja
                        </p>
                    )}
                </div>

                <div className="bg-surface-container p-6 rounded-xl group">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-on-surface text-sm">group</span>
                        <span className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">
                            Camareros
                        </span>
                    </div>
                    <h3 className="font-headline text-3xl font-bold text-on-surface">
                        {camarerosActivos.length}
                    </h3>
                </div>
            </section>

            {/* Bottom grid: Eficiencia + Productos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Métricas de Eficiencia */}
                <div className="bg-surface-container rounded-xl p-8">
                    <h4 className="font-headline text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-neon-blue text-sm">insights</span>
                        Métricas de Eficiencia
                    </h4>
                    <div className="space-y-6">
                        <div className="bg-surface-container-low rounded-xl p-5 border-l-4 border-neon-green">
                            <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold mb-1">
                                Ingresos por camarero
                            </p>
                            <h3 className="font-headline text-2xl font-bold text-on-surface">
                                €{camarerosActivos.length > 0 ? (metricas.ingresosTotales / camarerosActivos.length).toFixed(2) : '0.00'}
                                <span className="text-sm text-on-surface-variant font-normal"> /persona</span>
                            </h3>
                        </div>

                        {/* Última actividad */}
                        <div className="bg-surface-container-low rounded-xl p-5 border-l-4 border-neon-blue">
                            <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold mb-1">
                                Última actividad
                            </p>
                            <h3 className="font-headline text-lg font-bold text-on-surface">
                                {metricas.ultimaTransaccion
                                    ? new Date(metricas.ultimaTransaccion).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                                    : 'Sin actividad'}
                            </h3>
                        </div>

                        {/* Tiempo medio entre pedidos */}
                        <div className="bg-surface-container-low rounded-xl p-5 border-l-4 border-neon-orange">
                            <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold mb-1">
                                Ritmo servicio
                            </p>
                            <h3 className="font-headline text-2xl font-bold text-on-surface">
                                {metricas.tiempoMedioEntrePedidosMin !== null
                                    ? (metricas.tiempoMedioEntrePedidosMin < 60
                                        ? `${metricas.tiempoMedioEntrePedidosMin.toFixed(1)} min`
                                        : `${(metricas.tiempoMedioEntrePedidosMin / 60).toFixed(1)} h`)
                                    : '—'}
                                <span className="text-sm text-on-surface-variant font-normal"> entre pedidos</span>
                            </h3>
                        </div>

                        {/* Categoría más vendida */}
                        {metricas.categoriaMasVendida && (
                            <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                                <span className="material-symbols-outlined text-neon-green">category</span>
                                <div>
                                    <p className="text-[10px] text-neon-green font-bold uppercase tracking-widest mb-0.5">
                                        Categoría líder
                                    </p>
                                    <p className="text-sm font-bold text-on-surface">{metricas.categoriaMasVendida.categoria}</p>
                                    <p className="text-[10px] text-on-surface-variant">
                                        {metricas.categoriaMasVendida.cantidad} unidades vendidas
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Camareros asignados */}
                        <div className="space-y-3">
                            <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">
                                Personal asignado
                            </p>
                            {camarerosActivos.length === 0 ? (
                                <p className="text-on-surface-variant text-sm italic">
                                    No hay camareros asignados a esta barra
                                </p>
                            ) : (
                                camarerosActivos.map((c) => (
                                    <div
                                        key={c.idCamarero}
                                        className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-neon-green/10 flex items-center justify-center">
                                            <span className="text-xs font-bold text-neon-green">
                                                {c.nombre.charAt(0)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-on-surface">{c.nombre}</p>
                                            {c.apellidos && (
                                                <p className="text-[10px] text-on-surface-variant">{c.apellidos}</p>
                                            )}
                                        </div>
                                        <span className={cn(
                                            'ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider',
                                            c.activo ? 'bg-neon-green/10 text-neon-green' : 'bg-error/10 text-error'
                                        )}>
                                            {c.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                ))
                            )}

                        {/* Historial de Personal */}
                        <div className="space-y-3 pt-6 border-t border-white/5">
                            <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">
                                Historial de Personal
                            </p>
                            {historialCamareros.length === 0 ? (
                                <p className="text-on-surface-variant text-sm italic">
                                    Ningún camarero ha trabajado aquí aún
                                </p>
                            ) : (
                                historialCamareros.map(({ camarero: c, horasEnEstaBarra }) => (
                                    <div
                                        key={c.idCamarero}
                                        className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border border-white/5"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                                            <span className="text-xs font-bold text-on-surface">
                                                {c.nombre.charAt(0)}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-on-surface">{c.nombre}</p>
                                            {c.apellidos && (
                                                <p className="text-[10px] text-on-surface-variant">{c.apellidos}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-neon-blue/10 px-2 py-1 rounded">
                                            <span className="material-symbols-outlined text-[12px] text-neon-blue">schedule</span>
                                            <span className="text-xs font-bold font-headline text-neon-blue">{horasEnEstaBarra.toFixed(1)}h</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        </div>
                    </div>
                </div>

                {/* Análisis de Productos */}
                <div className="bg-surface-container rounded-xl p-8">
                    <h4 className="font-headline text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-neon-orange text-sm">local_dining</span>
                        Análisis de Productos
                    </h4>
                    <div className="space-y-6">
                        {/* Producto estrella */}
                        {metricas.productoEstrella && (
                            <div className="flex items-start gap-4 p-4 bg-surface-container-low rounded-xl">
                                <span className="material-symbols-outlined text-neon-green" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    star
                                </span>
                                <div>
                                    <p className="text-[10px] text-neon-green font-bold uppercase tracking-widest mb-1">
                                        Producto Estrella
                                    </p>
                                    <h4 className="font-headline text-lg font-bold text-on-surface">
                                        {metricas.productoEstrella.nombre}
                                    </h4>
                                    <p className="text-on-surface-variant text-xs">
                                        {metricas.productoEstrella.cantidad} unidades vendidas
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Producto menos vendido */}
                        {metricas.productoMenosVendido && (
                            <div className="flex items-start gap-4 p-4 bg-surface-container-low rounded-xl">
                                <span className="material-symbols-outlined text-neon-orange">
                                    trending_down
                                </span>
                                <div>
                                    <p className="text-[10px] text-neon-orange font-bold uppercase tracking-widest mb-1">
                                        Baja Rotación
                                    </p>
                                    <h4 className="font-headline text-lg font-bold text-on-surface">
                                        {metricas.productoMenosVendido.nombre}
                                    </h4>
                                    <p className="text-on-surface-variant text-xs">
                                        {metricas.productoMenosVendido.cantidad} unidades vendidas
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Catálogo completo */}
                        <div>
                            <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold mb-3">
                                Catálogo
                            </p>
                            <div className="space-y-2">
                                {productos.map((p) => (
                                    <div
                                        key={p.idProducto}
                                        className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg"
                                    >
                                        <span className="text-sm font-bold text-on-surface">{p.nombre}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-on-surface-variant uppercase">
                                                {p.categoria}
                                            </span>
                                            <span className="text-sm font-bold text-neon-blue">
                                                {p.precio.toFixed(2)}€
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {!metricas.productoEstrella && productos.length > 0 && (
                            <p className="text-on-surface-variant text-sm text-center py-4 italic">
                                Aún no hay ventas registradas en esta barra
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
