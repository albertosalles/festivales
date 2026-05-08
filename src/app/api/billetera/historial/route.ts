import { NextResponse } from 'next/server';
import { crearClienteServidor } from '@/lib/supabase/servidor';

/**
 * GET /api/billetera/historial?idWallet=X&limite=20
 * Devuelve las últimas transacciones de una wallet con nombre de barra incluido.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const idWalletParam = searchParams.get('idWallet');
    const limiteParam = searchParams.get('limite') ?? '20';

    if (!idWalletParam) {
        return NextResponse.json({ error: 'Parámetro idWallet obligatorio' }, { status: 400 });
    }

    const idWallet = Number(idWalletParam);
    const limite = Math.min(Number(limiteParam) || 20, 50);

    if (isNaN(idWallet) || idWallet <= 0) {
        return NextResponse.json({ error: 'idWallet inválido' }, { status: 400 });
    }

    try {
        const supabase = await crearClienteServidor();
        const { data, error } = await supabase
            .from('transacciones')
            .select(`
                id_transaccion,
                tipo_movimiento,
                monto,
                fecha,
                barras ( nombre_localizacion )
            `)
            .eq('id_wallet', idWallet)
            .order('fecha', { ascending: false })
            .limit(limite);

        if (error) throw error;

        const transacciones = (data ?? []).map((t: any) => ({
            idTransaccion: t.id_transaccion,
            tipoMovimiento: t.tipo_movimiento,
            monto: Number(t.monto),
            fecha: t.fecha,
            nombreBarra: t.barras?.nombre_localizacion ?? null,
        }));

        return NextResponse.json({ transacciones });
    } catch (err: any) {
        return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 });
    }
}
