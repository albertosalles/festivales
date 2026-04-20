import { NextResponse } from 'next/server';
import {
    obtenerMusicaSonando,
    actualizarMusicaSonando,
    GENEROS_MUSICA,
} from '@/servicios/conciertos.servicio';

/**
 * GET /api/conciertos/estado
 * Devuelve el género musical que está sonando actualmente.
 */
export async function GET() {
    try {
        const genero = await obtenerMusicaSonando();
        return NextResponse.json({ genero });
    } catch (err) {
        console.error('[API/conciertos/estado GET] Error:', err);
        return NextResponse.json(
            { error: 'Error al obtener el concierto actual' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/conciertos/estado
 * Actualiza el concierto que está sonando ahora.
 * Body: { genero: string }
 */
export async function POST(request: Request) {
    try {
        const { genero } = await request.json();

        if (!genero || typeof genero !== 'string' || !genero.trim()) {
            return NextResponse.json(
                { error: 'El género musical es obligatorio' },
                { status: 400 }
            );
        }

        const generoLimpio = genero.trim();

        // Validar que el género está en la lista permitida
        if (!GENEROS_MUSICA.includes(generoLimpio as typeof GENEROS_MUSICA[number])) {
            return NextResponse.json(
                { error: `Género no válido: ${generoLimpio}` },
                { status: 400 }
            );
        }

        await actualizarMusicaSonando(generoLimpio);

        return NextResponse.json({
            ok: true,
            genero: generoLimpio,
            mensaje: `Concierto actualizado a: ${generoLimpio}`,
        });
    } catch (err) {
        console.error('[API/conciertos/estado POST] Error:', err);
        return NextResponse.json(
            { error: 'Error al actualizar el concierto' },
            { status: 500 }
        );
    }
}
