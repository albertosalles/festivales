import { NextRequest, NextResponse } from 'next/server';
import { obtenerProductosPorBarra } from '@/servicios/productos.servicio';

/**
 * GET /api/barras/[idBarra]/productos
 * Obtiene los productos de una barra.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ idBarra: string }> }
) {
    try {
        const { idBarra } = await params;
        const id = Number(idBarra);

        if (!id || isNaN(id)) {
            return NextResponse.json(
                { error: 'ID de barra inválido' },
                { status: 400 }
            );
        }

        const productos = await obtenerProductosPorBarra(id);

        return NextResponse.json({ productos });
    } catch (err) {
        console.error('[API/productos] Error:', err);
        return NextResponse.json(
            { error: 'Error al obtener productos' },
            { status: 500 }
        );
    }
}
