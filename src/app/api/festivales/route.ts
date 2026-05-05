import { NextResponse } from 'next/server';
import {
    crearFestival,
    activarFestival,
    finalizarFestival,
    obtenerFestivalPorId,
    obtenerTodosFestivales,
    generarResumenFestival,
    anonimizarDatosFestival,
    purgarFestivalCompleto,
} from '@/servicios/festivales.servicio';

/** GET /api/festivales — lista todos los festivales */
export async function GET() {
    try {
        const festivales = await obtenerTodosFestivales();
        return NextResponse.json({ festivales });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error';
        console.error('[API/festivales GET]', msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

/**
 * POST /api/festivales
 * Body: { accion: 'crear' | 'activar' | 'finalizar', ... }
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { accion } = body;

        switch (accion) {
            case 'crear': {
                if (!body.nombre || typeof body.nombre !== 'string') {
                    return NextResponse.json(
                        { error: 'El nombre del festival es obligatorio' },
                        { status: 400 },
                    );
                }
                const festival = await crearFestival({
                    nombre: body.nombre.trim(),
                    ubicacion: body.ubicacion?.trim() || undefined,
                    fechaInicio: body.fechaInicio || undefined,
                    fechaFin: body.fechaFin || undefined,
                });
                return NextResponse.json({ festival });
            }
            case 'activar': {
                if (typeof body.idFestival !== 'number') {
                    return NextResponse.json({ error: 'idFestival requerido' }, { status: 400 });
                }
                await activarFestival(body.idFestival);
                return NextResponse.json({ ok: true });
            }
            case 'finalizar': {
                if (typeof body.idFestival !== 'number') {
                    return NextResponse.json({ error: 'idFestival requerido' }, { status: 400 });
                }
                await finalizarFestival(body.idFestival);
                return NextResponse.json({ ok: true });
            }
            case 'generar-resumen': {
                if (typeof body.idFestival !== 'number') {
                    return NextResponse.json({ error: 'idFestival requerido' }, { status: 400 });
                }
                const resumen = await generarResumenFestival(body.idFestival);
                return NextResponse.json({ resumen });
            }
            case 'anonimizar': {
                if (typeof body.idFestival !== 'number') {
                    return NextResponse.json({ error: 'idFestival requerido' }, { status: 400 });
                }
                const usuariosAfectados = await anonimizarDatosFestival(body.idFestival);
                return NextResponse.json({ ok: true, usuariosAfectados });
            }
            case 'purgar': {
                if (typeof body.idFestival !== 'number' || typeof body.confirmacion !== 'string') {
                    return NextResponse.json(
                        { error: 'idFestival y confirmacion (nombre exacto del festival) requeridos' },
                        { status: 400 },
                    );
                }
                // Validación server-side: la confirmación debe coincidir con el nombre del festival
                const festival = await obtenerFestivalPorId(body.idFestival);
                if (!festival) {
                    return NextResponse.json({ error: 'Festival no encontrado' }, { status: 404 });
                }
                if (body.confirmacion !== festival.nombre) {
                    return NextResponse.json(
                        { error: 'La confirmación no coincide con el nombre del festival' },
                        { status: 400 },
                    );
                }
                const log = await purgarFestivalCompleto(body.idFestival);
                return NextResponse.json({ ok: true, log });
            }
            default:
                return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error';
        console.error('[API/festivales POST]', msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
