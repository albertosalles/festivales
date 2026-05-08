import { obtenerBarras } from '@/servicios/barras.servicio';
import { obtenerCamareros } from '@/servicios/camareros.servicio';
import { obtenerIngresosPorBarra } from '@/servicios/metricas.servicio';
import { obtenerIncidenciasPendientes } from '@/servicios/incidencias.servicio';
import { ControlBarrasAdmin } from '@/components/mapa/ControlBarrasAdmin';

/**
 * Control de Barras — Panel Admin.
 * Vista de todas las barras con estado de cola, camareros, ingresos y acceso a detalle.
 */
export default async function PaginaControlBarras() {
    const [barras, camareros, ingresosPorBarra, incidencias] = await Promise.all([
        obtenerBarras(),
        obtenerCamareros(),
        obtenerIngresosPorBarra(),
        obtenerIncidenciasPendientes(),
    ]);

    const totalCamareros = camareros.length;
    const camarerosDisponibles = camareros.filter((c) => c.activo && !c.idBarraActual).length;

    // Crear mapa de ingresos por barra para paso rápido
    const mapaIngresos: Record<number, number> = {};
    for (const ib of ingresosPorBarra) {
        mapaIngresos[ib.idBarra] = ib.ingresos;
    }

    return (
        <div>
            {/* Header with stats */}
            <section className="mb-10 flex justify-between items-end">
                <div>
                    <span className="text-neon-blue font-bold text-xs tracking-widest uppercase mb-2 block">
                        Live Control
                    </span>
                    <h1 className="font-headline text-5xl font-black tracking-tighter text-on-surface italic uppercase">
                        Monitorización en Tiempo Real
                    </h1>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-widest">
                            Camareros disponibles
                        </p>
                        <p className="font-headline text-2xl font-black text-on-surface">
                            {camarerosDisponibles}
                            <span className="text-sm text-on-surface-variant font-normal">/{totalCamareros}</span>
                        </p>
                    </div>
                </div>
            </section>

            {/* Bar Grid */}
            <ControlBarrasAdmin
                barrasIniciales={barras}
                camarerosIniciales={camareros}
                ingresosPorBarra={mapaIngresos}
                incidenciasIniciales={incidencias}
            />
        </div>
    );
}
