import { NextResponse } from 'next/server';
import { procesarCompra } from '@/servicios/transacciones.servicio';
import { obtenerBilletera } from '@/servicios/billetera.servicio';

/**
 * POST /api/barras/comprar
 * Body: { idUsuario: number, idBarra: number, lineas: [{idProducto, cantidad, precioUnitario}] }
 */
export async function POST(request: Request) {
    try {
        const { idUsuario, idBarra, lineas } = await request.json();

        if (!idUsuario || !idBarra || !Array.isArray(lineas) || lineas.length === 0) {
            return NextResponse.json(
                { error: 'Datos de compra incompletos' },
                { status: 400 }
            );
        }

        // Obtener wallet del usuario
        const wallet = await obtenerBilletera(idUsuario);

        if (!wallet) {
            return NextResponse.json(
                { error: 'Wallet no encontrado para este usuario' },
                { status: 404 }
            );
        }

        await procesarCompra(wallet.idWallet, idBarra, lineas);

        return NextResponse.json({ ok: true });
    } catch (err) {
        const mensaje = err instanceof Error ? err.message : 'Error al procesar compra';
        console.error('[API/comprar] Error:', mensaje);

        const esSaldoInsuficiente = mensaje.includes('Saldo insuficiente');

        return NextResponse.json(
            { error: mensaje },
            { status: esSaldoInsuficiente ? 402 : 500 }
        );
    }
}
