import { NextResponse } from 'next/server';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import { MONTO_MINIMO_RECARGA, MONTO_MAXIMO_RECARGA } from '@/lib/constantes';

/**
 * API Route para recargar saldo en la billetera.
 * POST /api/billetera/recarga
 * Body: { idUsuario: number, monto: number }
 *
 * Utiliza una función RPC de PostgreSQL (recarga_saldo) que ejecuta
 * la operación de forma atómica dentro de una transacción:
 *   1. Bloquea la fila del wallet (FOR UPDATE)
 *   2. Actualiza el saldo
 *   3. Registra la transacción en la tabla transacciones
 *
 * Si algo falla, PostgreSQL hace rollback automático.
 *
 * Respuesta exitosa (200):
 *   { mensaje: string, nuevoSaldo: number }
 *
 * Errores:
 *   400 — Datos inválidos (monto fuera de rango, idUsuario inválido)
 *   404 — Wallet no encontrada para el usuario
 *   500 — Error interno del servidor
 */
export async function POST(request: Request) {
    try {
        const cuerpo = await request.json();
        const { idUsuario, monto } = cuerpo;

        // --- Validaciones ---

        // Validar idUsuario
        if (
            idUsuario === undefined ||
            idUsuario === null ||
            typeof idUsuario !== 'number' ||
            !Number.isInteger(idUsuario) ||
            idUsuario <= 0
        ) {
            return NextResponse.json(
                { error: 'idUsuario debe ser un número entero positivo' },
                { status: 400 }
            );
        }

        // Validar monto
        if (monto === undefined || monto === null || typeof monto !== 'number') {
            return NextResponse.json(
                { error: 'El monto es obligatorio y debe ser un número' },
                { status: 400 }
            );
        }

        if (monto < MONTO_MINIMO_RECARGA) {
            return NextResponse.json(
                {
                    error: `El monto mínimo de recarga es ${MONTO_MINIMO_RECARGA}€`,
                },
                { status: 400 }
            );
        }

        if (monto > MONTO_MAXIMO_RECARGA) {
            return NextResponse.json(
                {
                    error: `El monto máximo de recarga es ${MONTO_MAXIMO_RECARGA}€`,
                },
                { status: 400 }
            );
        }

        // --- Ejecutar recarga transaccional via RPC ---

        const supabase = await crearClienteServidor();

        const { data, error } = await supabase.rpc('recarga_saldo', {
            p_id_usuario: idUsuario,
            p_monto: monto,
        });

        if (error) {
            // Si el error viene de la función SQL (wallet no encontrada)
            if (error.message.includes('Wallet no encontrada')) {
                return NextResponse.json(
                    { error: 'No se encontró billetera para este usuario' },
                    { status: 404 }
                );
            }

            throw new Error(`Error en recarga: ${error.message}`);
        }

        // La RPC devuelve el nuevo saldo directamente
        const nuevoSaldo = Number(data);

        return NextResponse.json({
            mensaje: 'Recarga exitosa',
            nuevoSaldo,
        });
    } catch {
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
