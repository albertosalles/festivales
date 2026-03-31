import { NextRequest, NextResponse } from 'next/server';
import { actualizarPreferencias, obtenerUsuarioPorId } from '@/servicios/usuario.servicio';

/**
 * API Route para consultar y guardar las preferencias del usuario.
 *
 * GET  /api/auth/preferencias?idUsuario=123
 * POST /api/auth/preferencias  Body: { idUsuario, musica, comida }
 */

export async function GET(request: NextRequest) {
    try {
        const idUsuario = Number(request.nextUrl.searchParams.get('idUsuario'));

        if (!idUsuario) {
            return NextResponse.json(
                { error: 'idUsuario es obligatorio' },
                { status: 400 }
            );
        }

        const usuario = await obtenerUsuarioPorId(idUsuario);

        if (!usuario) {
            return NextResponse.json(
                { error: 'Usuario no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            musica: usuario.preferenciaMusica ?? null,
            comida: usuario.preferenciaComida ?? null,
        });
    } catch (err) {
        console.error('[API/preferencias GET] Error:', err);
        return NextResponse.json(
            { error: 'Error al obtener preferencias' },
            { status: 500 }
        );
    }
}

/**
 * API Route para guardar las preferencias del usuario.
 * POST /api/auth/preferencias
 * Body: { idUsuario: number, musica: string, comida: string }
 */
export async function POST(request: Request) {
    try {
        const { idUsuario, musica, comida } = await request.json();

        if (!idUsuario || typeof idUsuario !== 'number') {
            return NextResponse.json(
                { error: 'El ID de usuario es obligatorio' },
                { status: 400 }
            );
        }

        if (!musica || typeof musica !== 'string' || !musica.trim()) {
            return NextResponse.json(
                { error: 'Selecciona al menos un género de música' },
                { status: 400 }
            );
        }

        if (!comida || typeof comida !== 'string' || !comida.trim()) {
            return NextResponse.json(
                { error: 'Selecciona al menos una preferencia de comida' },
                { status: 400 }
            );
        }

        await actualizarPreferencias(idUsuario, musica.trim(), comida.trim());

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[API/preferencias] Error:', err);
        return NextResponse.json(
            { error: 'Error al guardar las preferencias' },
            { status: 500 }
        );
    }
}
