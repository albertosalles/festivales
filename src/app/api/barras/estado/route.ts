import { NextResponse } from 'next/server';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import type { EstadoCola } from '@/lib/tipos';
import { ESTADOS_COLA } from '@/lib/constantes';

/**
 * API Route para actualizar el estado de cola de una barra.
 * PATCH /api/barras/estado
 * Body: { idBarra: number, estadoCola: EstadoCola }
 */
export async function PATCH(request: Request) {
    try {
        const { idBarra, estadoCola } = await request.json();

        // Validar
        if (!idBarra || typeof idBarra !== 'number') {
            return NextResponse.json(
                { error: 'idBarra es obligatorio y debe ser un número' },
                { status: 400 }
            );
        }

        if (!ESTADOS_COLA.includes(estadoCola)) {
            return NextResponse.json(
                { error: `estadoCola debe ser uno de: ${ESTADOS_COLA.join(', ')}` },
                { status: 400 }
            );
        }

        const supabase = await crearClienteServidor();

        const { error } = await supabase
            .from('barras')
            .update({ estado_cola: estadoCola })
            .eq('id_barra', idBarra);

        if (error) {
            return NextResponse.json(
                { error: `Error al actualizar: ${error.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
