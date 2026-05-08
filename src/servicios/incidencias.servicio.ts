import { crearClienteServidor } from '@/lib/supabase/servidor';
import type { Incidencia, FilaIncidencia } from '@/lib/tipos';

function transformar(fila: FilaIncidencia): Incidencia {
    return {
        idIncidencia: fila.id_incidencia,
        idBarra: fila.id_barra,
        idCamarero: fila.id_camarero,
        tipoIncidencia: fila.tipo_incidencia,
        descripcion: fila.descripcion,
        fechaReporte: fila.fecha_reporte,
        estado: fila.estado as 'pendiente' | 'resuelta',
    };
}

export async function obtenerIncidenciasPendientes(): Promise<Incidencia[]> {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase
        .from('incidencias_barra')
        .select('*')
        .eq('estado', 'pendiente')
        .order('fecha_reporte', { ascending: false });

    if (error) throw new Error(`Error al obtener incidencias: ${error.message}`);
    return (data as FilaIncidencia[]).map(transformar);
}
