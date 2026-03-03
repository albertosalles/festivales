import { crearClienteServidor } from '@/lib/supabase/servidor';
import type { Barra, EstadoCola, FilaBarra } from '@/lib/tipos';

/**
 * Transforma una fila SQL de barras a la interfaz TypeScript.
 */
function transformarFila(fila: FilaBarra): Barra {
    return {
        idBarra: fila.id_barra,
        nombreLocalizacion: fila.nombre_localizacion,
        estadoCola: fila.estado_cola as EstadoCola,
    };
}

/**
 * Obtiene todas las barras del recinto ordenadas por nombre.
 */
export async function obtenerBarras(): Promise<Barra[]> {
    const supabase = await crearClienteServidor();

    const { data, error } = await supabase
        .from('barras')
        .select('id_barra, nombre_localizacion, estado_cola')
        .order('nombre_localizacion');

    if (error) {
        throw new Error(`Error al obtener barras: ${error.message}`);
    }

    return (data as FilaBarra[]).map(transformarFila);
}

/**
 * Obtiene una barra por su ID.
 */
export async function obtenerBarraPorId(idBarra: number): Promise<Barra | null> {
    const supabase = await crearClienteServidor();

    const { data, error } = await supabase
        .from('barras')
        .select('id_barra, nombre_localizacion, estado_cola')
        .eq('id_barra', idBarra)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // No encontrada
        throw new Error(`Error al obtener barra: ${error.message}`);
    }

    return transformarFila(data as FilaBarra);
}

/**
 * Actualiza el estado de cola de una barra (usado por admin/staff).
 */
export async function actualizarEstadoCola(
    idBarra: number,
    nuevoEstado: EstadoCola
): Promise<void> {
    const supabase = await crearClienteServidor();

    const { error } = await supabase
        .from('barras')
        .update({ estado_cola: nuevoEstado })
        .eq('id_barra', idBarra);

    if (error) {
        throw new Error(`Error al actualizar estado de cola: ${error.message}`);
    }
}
