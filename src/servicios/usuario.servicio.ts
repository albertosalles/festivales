import { crearClienteServidor } from '@/lib/supabase/servidor';
import { obtenerIdFestivalActivo } from '@/servicios/festivales.servicio';
import type { Usuario, FilaUsuario } from '@/lib/tipos';

/**
 * Transforma una fila SQL de usuario a la interfaz TypeScript.
 */
function transformarFila(fila: FilaUsuario): Usuario {
    return {
        idUsuario: fila.id_usuario,
        idFestival: fila.id_festival,
        nombre: fila.nombre,
        apellidos: fila.apellidos,
        edad: fila.edad,
        correo: fila.correo,
        telefono: fila.telefono,
        tokenPago: fila.token_pago,
        preferenciaMusica: fila.preferencia_musica,
        preferenciaComida: fila.preferencia_comida,
    };
}

/**
 * Busca un usuario por su código de pulsera (token_pago) dentro del festival activo.
 * El filtro por festival es importante porque el mismo token podría reutilizarse
 * en ediciones distintas.
 */
export async function obtenerPorPulsera(
    tokenPago: string
): Promise<Usuario | null> {
    const supabase = await crearClienteServidor();
    const idFestival = await obtenerIdFestivalActivo();

    const { data, error } = await supabase
        .from('usuario')
        .select('*')
        .eq('token_pago', tokenPago)
        .eq('id_festival', idFestival)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // No encontrado
        throw new Error(`Error al buscar usuario por pulsera: ${error.message}`);
    }

    return transformarFila(data as FilaUsuario);
}

/**
 * Obtiene un usuario por su ID. No filtra por festival activo: el id es global.
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

/**
 * Actualiza las preferencias de música y comida de un usuario.
 */
export async function actualizarPreferencias(
    idUsuario: number,
    musica: string,
    comida: string
): Promise<void> {
    const supabase = await crearClienteServidor();

    const { error } = await supabase
        .from('usuario')
        .update({
            preferencia_musica: musica,
            preferencia_comida: comida,
        })
        .eq('id_usuario', idUsuario);

    if (error) {
        throw new Error(`Error al actualizar preferencias: ${error.message}`);
    }
}
