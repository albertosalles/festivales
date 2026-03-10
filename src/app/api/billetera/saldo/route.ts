import { NextResponse } from 'next/server';
import { obtenerBilletera } from '@/servicios/billetera.servicio';

/**
 * API Route para consultar el saldo de la billetera.
 * GET /api/billetera/saldo?idUsuario=X
 *
 * Respuesta exitosa (200):
 *   { idWallet: number, saldo: number }
 *
 * Errores:
 *   400 — idUsuario no proporcionado o inválido
 *   404 — No se encontró wallet para ese usuario
 *   500 — Error interno del servidor
 */
export async function GET(request: Request) {
    try {
        // Extraer idUsuario de los query params
        const { searchParams } = new URL(request.url);
        const idUsuarioParam = searchParams.get('idUsuario');

        // Validar que se proporcionó el parámetro
        if (!idUsuarioParam) {
            return NextResponse.json(
                { error: 'El parámetro idUsuario es obligatorio' },
                { status: 400 }
            );
        }

        // Validar que es un número válido
        const idUsuario = Number(idUsuarioParam);
        if (isNaN(idUsuario) || !Number.isInteger(idUsuario) || idUsuario <= 0) {
            return NextResponse.json(
                { error: 'idUsuario debe ser un número entero positivo' },
                { status: 400 }
            );
        }

        // Consultar la billetera usando el servicio existente
        const wallet = await obtenerBilletera(idUsuario);

        if (!wallet) {
            return NextResponse.json(
                { error: 'No se encontró billetera para este usuario' },
                { status: 404 }
            );
        }

        // Devolver saldo e idWallet
        return NextResponse.json({
            idWallet: wallet.idWallet,
            saldo: wallet.saldo,
        });
    } catch {
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
