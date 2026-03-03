import { crearClienteServidor } from '@/lib/supabase/servidor';
import type { Transaccion, TipoMovimiento, FilaTransaccion } from '@/lib/tipos';

/**
 * Transforma una fila SQL de transacciones a la interfaz TypeScript.
 */
function transformarFila(fila: FilaTransaccion): Transaccion {
    return {
        idTransaccion: fila.id_transaccion,
        idWallet: fila.id_wallet,
        idBarra: fila.id_barra,
        tipoMovimiento: fila.tipo_movimiento as TipoMovimiento,
        monto: Number(fila.monto),
        fecha: fila.fecha,
    };
}

/**
 * Obtiene las transacciones de una billetera, ordenadas por fecha descendente.
 */
export async function obtenerTransacciones(
    idWallet: number,
    limite: number = 50
): Promise<Transaccion[]> {
    const supabase = await crearClienteServidor();

    const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .eq('id_wallet', idWallet)
        .order('fecha', { ascending: false })
        .limit(limite);

    if (error) {
        throw new Error(`Error al obtener transacciones: ${error.message}`);
    }

    return (data as FilaTransaccion[]).map(transformarFila);
}

/**
 * Registra una nueva transacción.
 */
export async function registrarTransaccion(datos: {
    idWallet: number;
    idBarra: number;
    tipoMovimiento: TipoMovimiento;
    monto: number;
}): Promise<Transaccion> {
    const supabase = await crearClienteServidor();

    const { data, error } = await supabase
        .from('transacciones')
        .insert({
            id_wallet: datos.idWallet,
            id_barra: datos.idBarra,
            tipo_movimiento: datos.tipoMovimiento,
            monto: datos.monto,
        })
        .select('*')
        .single();

    if (error) {
        throw new Error(`Error al registrar transacción: ${error.message}`);
    }

    return transformarFila(data as FilaTransaccion);
}
