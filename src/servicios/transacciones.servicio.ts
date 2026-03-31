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

/** Línea de un pedido para procesarCompra */
interface LineaPedido {
    idProducto: number;
    cantidad: number;
    precioUnitario: number;
}

/**
 * Procesa una compra completa:
 * 1. Verifica que el wallet tenga saldo suficiente.
 * 2. Crea la transacción (tipo 'compra').
 * 3. Inserta las líneas de la transacción.
 * 4. Resta el monto del saldo del wallet.
 */
export async function procesarCompra(
    idWallet: number,
    idBarra: number,
    lineas: LineaPedido[]
): Promise<void> {
    const supabase = await crearClienteServidor();

    // Calcular monto total
    const montoTotal = lineas.reduce(
        (acc, l) => acc + l.cantidad * l.precioUnitario,
        0
    );

    if (montoTotal <= 0) {
        throw new Error('El monto total del pedido debe ser mayor a 0');
    }

    // 1. Verificar saldo
    const { data: wallet, error: errorWallet } = await supabase
        .from('wallet')
        .select('id_wallet, saldo')
        .eq('id_wallet', idWallet)
        .single();

    if (errorWallet || !wallet) {
        throw new Error('Wallet no encontrado');
    }

    if (Number(wallet.saldo) < montoTotal) {
        throw new Error('Saldo insuficiente');
    }

    // 2. Crear transacción
    const { data: transaccion, error: errorTx } = await supabase
        .from('transacciones')
        .insert({
            id_wallet: idWallet,
            id_barra: idBarra,
            tipo_movimiento: 'compra',
            monto: montoTotal,
        })
        .select('id_transaccion')
        .single();

    if (errorTx || !transaccion) {
        throw new Error(`Error al crear transacción: ${errorTx?.message}`);
    }

    // 3. Insertar líneas
    const filasLineas = lineas.map((l) => ({
        id_transaccion: transaccion.id_transaccion,
        id_producto: l.idProducto,
        cantidad: l.cantidad,
        precio_unitario: l.precioUnitario,
    }));

    const { error: errorLineas } = await supabase
        .from('lineas_transaccion')
        .insert(filasLineas);

    if (errorLineas) {
        throw new Error(`Error al insertar líneas: ${errorLineas.message}`);
    }

    // 4. Restar saldo
    const nuevoSaldo = Number(wallet.saldo) - montoTotal;

    const { error: errorUpdate } = await supabase
        .from('wallet')
        .update({ saldo: nuevoSaldo })
        .eq('id_wallet', idWallet);

    if (errorUpdate) {
        throw new Error(`Error al actualizar saldo: ${errorUpdate.message}`);
    }
}

