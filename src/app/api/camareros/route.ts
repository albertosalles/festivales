import { NextResponse } from 'next/server';
import { obtenerCamareros, crearCamarero, actualizarEstadoCamarero, asignarCamareroABarra } from '@/servicios/camareros.servicio';

/** GET /api/camareros — lista todos los camareros */
export async function GET() {
    try {
        const camareros = await obtenerCamareros();
        return NextResponse.json({ camareros });
    } catch (err) {
        console.error('[API/camareros GET]', err);
        return NextResponse.json({ error: 'Error al obtener camareros' }, { status: 500 });
    }
}

/**
 * POST /api/camareros
 * Body: { accion: 'crear' | 'estado' | 'asignar', ... }
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { accion } = body;

        switch (accion) {
            case 'crear': {
                const camarero = await crearCamarero({ nombre: body.nombre, apellidos: body.apellidos });
                return NextResponse.json({ camarero });
            }
            case 'estado': {
                await actualizarEstadoCamarero(body.idCamarero, body.activo);
                return NextResponse.json({ ok: true });
            }
            case 'asignar': {
                await asignarCamareroABarra(body.idCamarero, body.idBarra ?? null);
                return NextResponse.json({ ok: true });
            }
            default:
                return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error';
        console.error('[API/camareros POST]', msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
