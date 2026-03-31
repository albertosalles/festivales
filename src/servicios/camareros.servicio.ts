import { crearClienteServidor } from '@/lib/supabase/servidor';
import type { Camarero, FilaCamarero, AsignacionCamarero, FilaAsignacionCamarero } from '@/lib/tipos';

/* ── Transformadores ── */

function transformarFilaCamarero(fila: FilaCamarero): Camarero {
    return {
        idCamarero: fila.id_camarero,
        nombre: fila.nombre,
        apellidos: fila.apellidos,
        activo: fila.activo,
        idBarraActual: fila.id_barra_actual,
    };
}

function transformarFilaAsignacion(fila: FilaAsignacionCamarero): AsignacionCamarero {
    return {
        idAsignacion: fila.id_asignacion,
        idCamarero: fila.id_camarero,
        idBarra: fila.id_barra,
        fechaInicio: fila.fecha_inicio,
        fechaFin: fila.fecha_fin,
        horasImputadas: Number(fila.horas_imputadas),
    };
}

/* ── Consultas ── */

/** Obtener todos los camareros */
export async function obtenerCamareros(): Promise<Camarero[]> {
    const supabase = await crearClienteServidor();

    const { data, error } = await supabase
        .from('camareros')
        .select('*')
        .order('nombre');

    if (error) throw new Error(`Error al obtener camareros: ${error.message}`);
    return (data as FilaCamarero[]).map(transformarFilaCamarero);
}

/** Obtener un camarero por ID */
export async function obtenerCamareroPorId(id: number): Promise<Camarero | null> {
    const supabase = await crearClienteServidor();

    const { data, error } = await supabase
        .from('camareros')
        .select('*')
        .eq('id_camarero', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Error al obtener camarero: ${error.message}`);
    }
    return transformarFilaCamarero(data as FilaCamarero);
}

/** Crear un camarero nuevo */
export async function crearCamarero(datos: {
    nombre: string;
    apellidos?: string;
}): Promise<Camarero> {
    const supabase = await crearClienteServidor();

    const { data, error } = await supabase
        .from('camareros')
        .insert({ nombre: datos.nombre, apellidos: datos.apellidos ?? null })
        .select('*')
        .single();

    if (error) throw new Error(`Error al crear camarero: ${error.message}`);
    return transformarFilaCamarero(data as FilaCamarero);
}

/** Actualizar estado activo/inactivo de un camarero */
export async function actualizarEstadoCamarero(
    idCamarero: number,
    activo: boolean
): Promise<void> {
    const supabase = await crearClienteServidor();

    const { error } = await supabase
        .from('camareros')
        .update({ activo })
        .eq('id_camarero', idCamarero);

    if (error) throw new Error(`Error al actualizar estado: ${error.message}`);
}

/**
 * Asignar un camarero a una barra.
 * - Cierra la asignación anterior (si existía).
 * - Crea una nueva entrada en asignaciones_camareros.
 * - Actualiza id_barra_actual en el camarero.
 */
export async function asignarCamareroABarra(
    idCamarero: number,
    idBarra: number | null
): Promise<void> {
    const supabase = await crearClienteServidor();

    // 1. Cerrar asignación abierta previa
    const { data: abiertas } = await supabase
        .from('asignaciones_camareros')
        .select('id_asignacion')
        .eq('id_camarero', idCamarero)
        .is('fecha_fin', null);

    if (abiertas && abiertas.length > 0) {
        await supabase
            .from('asignaciones_camareros')
            .update({ fecha_fin: new Date().toISOString() })
            .in('id_asignacion', abiertas.map((a: { id_asignacion: number }) => a.id_asignacion));
    }

    // 2. Si hay nueva barra, crear nueva asignación
    if (idBarra !== null) {
        const { error: errorInsert } = await supabase
            .from('asignaciones_camareros')
            .insert({ id_camarero: idCamarero, id_barra: idBarra });

        if (errorInsert) throw new Error(`Error al asignar: ${errorInsert.message}`);
    }

    // 3. Actualizar barra actual del camarero
    const { error } = await supabase
        .from('camareros')
        .update({ id_barra_actual: idBarra })
        .eq('id_camarero', idCamarero);

    if (error) throw new Error(`Error al actualizar barra actual: ${error.message}`);
}

/** Obtener camareros asignados a una barra específica */
export async function obtenerCamarerosPorBarra(idBarra: number): Promise<Camarero[]> {
    const supabase = await crearClienteServidor();

    const { data, error } = await supabase
        .from('camareros')
        .select('*')
        .eq('id_barra_actual', idBarra)
        .order('nombre');

    if (error) throw new Error(`Error al obtener camareros de barra: ${error.message}`);
    return (data as FilaCamarero[]).map(transformarFilaCamarero);
}

/** Obtener total de horas de un camarero (suma de asignaciones cerradas) */
export async function obtenerTotalHorasCamarero(idCamarero: number): Promise<number> {
    const supabase = await crearClienteServidor();

    const { data, error } = await supabase
        .from('asignaciones_camareros')
        .select('fecha_inicio, fecha_fin')
        .eq('id_camarero', idCamarero)
        .not('fecha_fin', 'is', null);

    if (error) return 0;

    let totalMinutos = 0;
    for (const fila of data ?? []) {
        const inicio = new Date(fila.fecha_inicio).getTime();
        const fin = new Date(fila.fecha_fin).getTime();
        totalMinutos += (fin - inicio) / 60000;
    }
    return totalMinutos;
}
