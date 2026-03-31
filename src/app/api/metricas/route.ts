import { NextResponse } from 'next/server';
import { obtenerMetricasGlobales, obtenerIngresosPorBarra } from '@/servicios/metricas.servicio';

/** GET /api/metricas — métricas globales del festival */
export async function GET() {
    try {
        const [metricas, ingresosPorBarra] = await Promise.all([
            obtenerMetricasGlobales(),
            obtenerIngresosPorBarra(),
        ]);
        return NextResponse.json({ metricas, ingresosPorBarra });
    } catch (err) {
        console.error('[API/metricas]', err);
        return NextResponse.json({ error: 'Error al obtener métricas' }, { status: 500 });
    }
}
