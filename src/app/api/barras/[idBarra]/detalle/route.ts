import { NextRequest, NextResponse } from 'next/server';
import { obtenerMetricasBarra } from '@/servicios/metricas.servicio';
import { obtenerBarraPorId } from '@/servicios/barras.servicio';
import { obtenerCamarerosPorBarra } from '@/servicios/camareros.servicio';
import { obtenerProductosPorBarra } from '@/servicios/productos.servicio';

/** GET /api/barras/[idBarra]/detalle — métricas + camareros + productos de una barra */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ idBarra: string }> }
) {
    try {
        const { idBarra } = await params;
        const id = Number(idBarra);

        if (!id || isNaN(id)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
        }

        const [barra, metricas, camareros, productos] = await Promise.all([
            obtenerBarraPorId(id),
            obtenerMetricasBarra(id),
            obtenerCamarerosPorBarra(id),
            obtenerProductosPorBarra(id),
        ]);

        if (!barra) {
            return NextResponse.json({ error: 'Barra no encontrada' }, { status: 404 });
        }

        return NextResponse.json({ barra, metricas, camareros, productos });
    } catch (err) {
        console.error('[API/barras/detalle]', err);
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}
