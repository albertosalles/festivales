import { NextResponse } from 'next/server';
import { obtenerBilletera, recargarSaldo } from '@/servicios/billetera.servicio';
import { MONTO_MINIMO_RECARGA, MONTO_MAXIMO_RECARGA } from '@/lib/constantes';

/**
 * API Route para recargar saldo en la billetera.
 * POST /api/billetera/recarga
 * Body: { idUsuario: number, monto: number }
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

        // --- Obtener wallet y ejecutar recarga ---

        const wallet = await obtenerBilletera(idUsuario);

        if (!wallet) {
            return NextResponse.json(
                { error: 'No se encontró billetera para este usuario' },
                { status: 404 }
            );
        }

        const walletActualizada = await recargarSaldo(wallet.idWallet, monto);

        return NextResponse.json({
            mensaje: 'Recarga exitosa',
            nuevoSaldo: walletActualizada.saldo,
        });
    } catch {
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
