import { crearClienteServidor } from '@/lib/supabase/servidor';
import type { Wallet, FilaWallet } from '@/lib/tipos';

/**
 * Transforma una fila SQL de wallet a la interfaz TypeScript.
 */
function transformarFila(fila: FilaWallet): Wallet {
    return {
        idWallet: fila.id_wallet,
        idUsuario: fila.id_usuario,
        saldo: Number(fila.saldo),
    };
}

/**
 * Obtiene la billetera de un usuario por su ID de usuario.
 */
export async function obtenerBilletera(
    idUsuario: number
): Promise<Wallet | null> {
    const supabase = await crearClienteServidor();

    const { data, error } = await supabase
        .from('wallet')
        .select('id_wallet, id_usuario, saldo')
        .eq('id_usuario', idUsuario)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Error al obtener billetera: ${error.message}`);
    }

    return transformarFila(data as FilaWallet);
}

/**
 * Recarga el saldo de la billetera del usuario (simulado en MVP).
 * Suma la cantidad indicada al saldo actual.
 */
export async function recargarSaldo(
    idWallet: number,
    cantidad: number
): Promise<Wallet> {
    if (cantidad <= 0) {
        throw new Error('La cantidad de recarga debe ser positiva');
    }

    const supabase = await crearClienteServidor();

    // Obtener saldo actual
    const { data: walletActual, error: errorLectura } = await supabase
        .from('wallet')
        .select('id_wallet, id_usuario, saldo')
        .eq('id_wallet', idWallet)
        .single();

    if (errorLectura) {
        throw new Error(`Error al leer billetera: ${errorLectura.message}`);
    }

    const nuevoSaldo = Number(walletActual.saldo) + cantidad;

    const { data, error } = await supabase
        .from('wallet')
        .update({ saldo: nuevoSaldo })
        .eq('id_wallet', idWallet)
        .select('id_wallet, id_usuario, saldo')
        .single();

    if (error) {
        throw new Error(`Error al recargar saldo: ${error.message}`);
    }

    return transformarFila(data as FilaWallet);
}
