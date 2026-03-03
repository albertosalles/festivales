import { crearClienteServidor } from '@/lib/supabase/servidor';
import type { Usuario, FilaUsuario } from '@/lib/tipos';

/**
 * Transforma una fila SQL de usuario a la interfaz TypeScript.
 */
function transformarFila(fila: FilaUsuario): Usuario {
    return {
        idUsuario: fila.id_usuario,
        nombre: fila.nombre,
        apellidos: fila.apellidos,
        edad: fila.edad,
        correo: fila.correo,
        telefono: fila.telefono,
        tokenPago: fila.token_pago,
    };
}

/**
 * Busca un usuario por su código de pulsera (token_pago).
 * Este es el método de autenticación del MVP.
 */
export async function obtenerPorPulsera(
    tokenPago: string
): Promise<Usuario | null> {
    const supabase = await crearClienteServidor();

    const { data, error } = await supabase
        .from('usuario')
        .select('*')
        .eq('token_pago', tokenPago)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // No encontrado
        throw new Error(`Error al buscar usuario por pulsera: ${error.message}`);
    }

    return transformarFila(data as FilaUsuario);
}

/**
 * Obtiene un usuario por su ID.
 */
export async function obtenerUsuarioPorId(
    idUsuario: number
): Promise<Usuario | null> {
    const supabase = await crearClienteServidor();

    const { data, error } = await supabase
        .from('usuario')
        .select('*')
        .eq('id_usuario', idUsuario)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Error al obtener usuario: ${error.message}`);
    }

    return transformarFila(data as FilaUsuario);
}
