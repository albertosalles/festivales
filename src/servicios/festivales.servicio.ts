import { cache } from 'react';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import type {
    DatosDiaFestival,
    EstadoFestival,
    Festival,
    FilaFestival,
    FilaResumenFestival,
    IngresosBarraDia,
    ResumenFestival,
} from '@/lib/tipos';

/* ── Transformadores ── */

function transformarFila(fila: FilaFestival): Festival {
    return {
        idFestival: fila.id_festival,
        nombre: fila.nombre,
        ubicacion: fila.ubicacion ?? undefined,
        fechaInicio: fila.fecha_inicio ?? undefined,
        fechaFin: fila.fecha_fin ?? undefined,
        activo: fila.activo,
        estado: fila.estado as EstadoFestival,
        createdAt: fila.created_at,
    };
}

function transformarFilaResumen(fila: FilaResumenFestival): ResumenFestival {
    return {
        idResumen: fila.id_resumen,
        idFestival: fila.id_festival,
        totalAsistentes: fila.total_asistentes,
        totalTransacciones: fila.total_transacciones,
        recaudacionTotal: Number(fila.recaudacion_total),
        ticketMedio: Number(fila.ticket_medio),
        saldoMedioFinal: Number(fila.saldo_medio_final),
        totalRecargas: Number(fila.total_recargas),
        totalCamareros: fila.total_camareros,
        totalIncidencias: fila.total_incidencias,
        horasTotalesServicio: Number(fila.horas_totales_servicio),
        eficienciaEurosHora: Number(fila.eficiencia_euros_hora),
        productoEstrella: fila.producto_estrella ?? undefined,
        datosPorBarra: fila.datos_por_barra ?? [],
        datosPorDia: fila.datos_por_dia ?? [],
        createdAt: fila.created_at,
    };
}

/* ── Consultas ── */

/**
 * Obtiene el festival actualmente activo. Cacheado por request (React cache):
 * múltiples servicios pueden llamarlo en el mismo render sin penalización.
 */
export const obtenerFestivalActivo = cache(async (): Promise<Festival> => {
    const supabase = await crearClienteServidor();

    const { data, error } = await supabase
        .from('festivales')
        .select('*')
        .eq('activo', true)
        .single();

    if (error || !data) {
        throw new Error(
            'No hay ningún festival activo. ' +
            'Crea uno o activa uno desde /admin/festivales.',
        );
    }
    return transformarFila(data as FilaFestival);
});

/**
 * Atajo: devuelve solo el id del festival activo. Misma cache compartida.
 */
export const obtenerIdFestivalActivo = cache(async (): Promise<number> => {
    const f = await obtenerFestivalActivo();
    return f.idFestival;
});

/**
 * Lista todos los festivales (para gestión y comparativa).
 */
export async function obtenerTodosFestivales(): Promise<Festival[]> {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase
        .from('festivales')
        .select('*')
        .order('id_festival', { ascending: false });

    if (error) throw new Error(`Error al listar festivales: ${error.message}`);
    return (data as FilaFestival[]).map(transformarFila);
}

export async function obtenerFestivalPorId(id: number): Promise<Festival | null> {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase
        .from('festivales')
        .select('*')
        .eq('id_festival', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Error al obtener festival: ${error.message}`);
    }
    return transformarFila(data as FilaFestival);
}

/* ── Mutaciones ── */

export interface DatosFestival {
    nombre: string;
    ubicacion?: string;
    fechaInicio?: string;
    fechaFin?: string;
}

/**
 * Crea un festival nuevo (no se activa por defecto).
 */
export async function crearFestival(datos: DatosFestival): Promise<Festival> {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase
        .from('festivales')
        .insert({
            nombre: datos.nombre,
            ubicacion: datos.ubicacion ?? null,
            fecha_inicio: datos.fechaInicio ?? null,
            fecha_fin: datos.fechaFin ?? null,
            activo: false,
            estado: 'en_curso',
        })
        .select('*')
        .single();

    if (error) throw new Error(`Error al crear festival: ${error.message}`);
    return transformarFila(data as FilaFestival);
}

/**
 * Activa un festival y desactiva el resto (transición atómica vía dos updates;
 * el índice único parcial de la BD garantiza la invariante incluso ante carreras).
 *
 * Si el festival venía de estado 'finalizado' (cerrado y reactivado), se vuelve
 * a 'en_curso' para mantener la coherencia entre `activo` y `estado`.
 * Festivales ya purgados o anonimizados NO se pueden reactivar (lanza excepción).
 */
export async function activarFestival(id: number): Promise<void> {
    const supabase = await crearClienteServidor();

    const objetivo = await obtenerFestivalPorId(id);
    if (!objetivo) throw new Error(`Festival ${id} no encontrado`);
    if (objetivo.estado === 'purgado' || objetivo.estado === 'anonimizado') {
        throw new Error(
            `No se puede reactivar un festival ${objetivo.estado}. Crea uno nuevo.`,
        );
    }

    // 1. Desactivar todos los demás
    const { error: errOff } = await supabase
        .from('festivales')
        .update({ activo: false })
        .neq('id_festival', id);
    if (errOff) throw new Error(`Error al desactivar festivales: ${errOff.message}`);

    // 2. Activar el solicitado, restaurando estado coherente si venía de 'finalizado'
    const nuevoEstado = objetivo.estado === 'finalizado' ? 'en_curso' : objetivo.estado;
    const { error: errOn } = await supabase
        .from('festivales')
        .update({ activo: true, estado: nuevoEstado })
        .eq('id_festival', id);
    if (errOn) throw new Error(`Error al activar festival: ${errOn.message}`);
}

/**
 * Marca un festival como finalizado (no activo). No elimina datos.
 */
export async function finalizarFestival(id: number): Promise<void> {
    const supabase = await crearClienteServidor();
    const { error } = await supabase
        .from('festivales')
        .update({ activo: false, estado: 'finalizado' })
        .eq('id_festival', id);

    if (error) throw new Error(`Error al finalizar festival: ${error.message}`);
}

/* ── Funciones de purgado (envuelven RPCs SQL) ── */

/**
 * Genera (o regenera) el resumen agregado de un festival.
 * Idempotente: se puede llamar varias veces.
 */
export async function generarResumenFestival(id: number): Promise<ResumenFestival> {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.rpc('generar_resumen_festival', { p_id_festival: id });

    if (error) throw new Error(`Error al generar resumen: ${error.message}`);
    const r = await obtenerResumenFestival(id);
    if (!r) throw new Error('Resumen generado pero no recuperable');
    return r;
}

/**
 * Anonimiza datos personales y borra líneas de transacción detalladas.
 * Requiere resumen previo. Devuelve nº de usuarios anonimizados.
 */
export async function anonimizarDatosFestival(id: number): Promise<number> {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase.rpc('anonimizar_datos_festival', {
        p_id_festival: id,
    });

    if (error) throw new Error(`Error al anonimizar: ${error.message}`);
    return Number(data ?? 0);
}

/**
 * Elimina todos los datos operativos del festival. Mantiene festivales + resumen.
 * Requiere resumen previo y festival no activo.
 */
export async function purgarFestivalCompleto(id: number): Promise<string> {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase.rpc('purgar_festival_completo', {
        p_id_festival: id,
    });

    if (error) throw new Error(`Error al purgar festival: ${error.message}`);
    return String(data ?? '');
}

/* ── Resumen ── */

export async function obtenerResumenFestival(id: number): Promise<ResumenFestival | null> {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase
        .from('resumen_festival')
        .select('*')
        .eq('id_festival', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(`Error al obtener resumen: ${error.message}`);
    }
    return transformarFilaResumen(data as FilaResumenFestival);
}

/**
 * Devuelve los resúmenes de todos los festivales que ya tienen uno generado.
 * Útil para la comparativa entre ediciones.
 */
export async function obtenerResumenesFestivales(): Promise<ResumenFestival[]> {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase
        .from('resumen_festival')
        .select('*')
        .order('id_festival', { ascending: false });

    if (error) throw new Error(`Error al listar resúmenes: ${error.message}`);
    return (data as FilaResumenFestival[]).map(transformarFilaResumen);
}

/* ── Desglose diario (sprint 5) ── */

/**
 * Calcula el desglose por día del festival indicado en vivo (sin escribir en
 * resumen_festival). Útil para mostrar el progreso del festival mientras está
 * en curso. Comparte la lógica con `generar_resumen_festival`.
 */
export async function calcularDatosPorDia(idFestival: number): Promise<DatosDiaFestival[]> {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase.rpc('calcular_datos_por_dia', {
        p_id_festival: idFestival,
    });

    if (error) throw new Error(`Error al calcular datos diarios: ${error.message}`);
    return (data as DatosDiaFestival[] | null) ?? [];
}

/** Resumen de una edición pasada con su desglose diario, listo para comparar. */
export interface EdicionConDatosDia {
    idFestival: number;
    nombre: string;
    datosPorDia: DatosDiaFestival[];
}

/**
 * Obtiene el desglose diario del festival activo (calculado en vivo) junto con
 * los desgloses de todas las ediciones pasadas que ya tienen resumen generado.
 *
 * Devuelve `{ actual, ediciones }`:
 *  - `actual`: edición activa con datos en vivo. `null` si no hay festival activo.
 *  - `ediciones`: ediciones cerradas con `datos_por_dia` no vacío, ordenadas de
 *    más reciente a más antigua.
 */
export async function obtenerComparativaDiaria(): Promise<{
    actual: EdicionConDatosDia | null;
    ediciones: EdicionConDatosDia[];
}> {
    const supabase = await crearClienteServidor();

    // 1. Festival activo (puede no existir → no lanzar)
    const { data: festivalActivo } = await supabase
        .from('festivales')
        .select('id_festival, nombre')
        .eq('activo', true)
        .maybeSingle();

    let actual: EdicionConDatosDia | null = null;
    if (festivalActivo) {
        const datosPorDia = await calcularDatosPorDia(festivalActivo.id_festival);
        actual = {
            idFestival: festivalActivo.id_festival,
            nombre: festivalActivo.nombre,
            datosPorDia,
        };
    }

    // 2. Ediciones pasadas: las que ya tienen resumen y son distintas del activo
    const { data: resumenes, error } = await supabase
        .from('resumen_festival')
        .select('id_festival, datos_por_dia, festivales(nombre)')
        .order('id_festival', { ascending: false });

    if (error) throw new Error(`Error al listar comparativa diaria: ${error.message}`);

    type ResumenComparativa = {
        id_festival: number;
        datos_por_dia: DatosDiaFestival[] | null;
        festivales: { nombre: string } | { nombre: string }[] | null;
    };

    const ediciones: EdicionConDatosDia[] = (resumenes as ResumenComparativa[] ?? [])
        .filter((r) => r.id_festival !== actual?.idFestival)
        .map((r) => {
            // Supabase puede devolver el embed como objeto u array según versiones
            const festival = Array.isArray(r.festivales) ? r.festivales[0] : r.festivales;
            return {
                idFestival: r.id_festival,
                nombre: festival?.nombre ?? `Festival #${r.id_festival}`,
                datosPorDia: r.datos_por_dia ?? [],
            };
        })
        .filter((e) => e.datosPorDia.length > 0);

    return { actual, ediciones };
}

/**
 * Helper: agrupa entradas de varias ediciones por `dia_relativo` (1=vie, 2=sáb,
 * 3=dom). Devuelve un objeto por día con la entrada de cada edición.
 *
 * Uso: alimentar gráficos comparativos día-a-día sin lidiar con desalineación
 * de fechas absolutas entre ediciones.
 *
 * Días con `dia_relativo = null` se ignoran (datos fuera de vie/sáb/dom).
 */
export function agruparPorDiaRelativo(
    ediciones: EdicionConDatosDia[],
): Array<{
    diaRelativo: 1 | 2 | 3;
    diaSemana: 'viernes' | 'sábado' | 'domingo';
    entradas: Array<{ idFestival: number; nombre: string; datos: DatosDiaFestival }>;
}> {
    const diasSemana = ['viernes', 'sábado', 'domingo'] as const;
    return ([1, 2, 3] as const).map((diaRelativo) => ({
        diaRelativo,
        diaSemana: diasSemana[diaRelativo - 1],
        entradas: ediciones
            .map((ed) => {
                const dia = ed.datosPorDia.find((d) => d.dia_relativo === diaRelativo);
                if (!dia) return null;
                return { idFestival: ed.idFestival, nombre: ed.nombre, datos: dia };
            })
            .filter(
                (e): e is { idFestival: number; nombre: string; datos: DatosDiaFestival } =>
                    e !== null,
            ),
    }));
}

// Marcadores para evitar warning de "imported but unused" si TS Build pasa por aquí
// antes de que la UI consuma estos tipos.
export type { DatosDiaFestival, IngresosBarraDia };
