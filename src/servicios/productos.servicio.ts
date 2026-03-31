import { crearClienteServidor } from '@/lib/supabase/servidor';
import type { Producto, FilaProducto } from '@/lib/tipos';

/**
 * Transforma una fila SQL de productos a la interfaz TypeScript.
 */
function transformarFila(fila: FilaProducto): Producto {
    return {
        idProducto: fila.id_producto,
        idBarra: fila.id_barra,
        nombre: fila.nombre,
        precio: Number(fila.precio),
        categoria: fila.categoria,
    };
}

/**
 * Obtiene todos los productos de una barra por su ID.
 */
export async function obtenerProductosPorBarra(
    idBarra: number
): Promise<Producto[]> {
    const supabase = await crearClienteServidor();

    const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('id_barra', idBarra)
        .order('nombre');

    if (error) {
        throw new Error(`Error al obtener productos: ${error.message}`);
    }

    return (data as FilaProducto[]).map(transformarFila);
}
