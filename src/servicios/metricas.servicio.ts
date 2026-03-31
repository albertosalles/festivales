import { crearClienteServidor } from '@/lib/supabase/servidor';

/** Métricas globales del festival */
export interface MetricasGlobales {
    totalTransacciones: number;
    ingresosTotales: number;
    ticketMedio: number;
}

/** Métricas de una barra específica */
export interface MetricasBarra {
    totalTransacciones: number;
    ingresosTotales: number;
    ticketMedio: number;
    productoEstrella: { nombre: string; cantidad: number } | null;
    productoMenosVendido: { nombre: string; cantidad: number } | null;
}

/**
 * Obtiene métricas globales del festival.
 */
export async function obtenerMetricasGlobales(): Promise<MetricasGlobales> {
    const supabase = await crearClienteServidor();

    const { data, error } = await supabase
        .from('transacciones')
        .select('monto')
        .eq('tipo_movimiento', 'compra');

    if (error) throw new Error(`Error al obtener métricas: ${error.message}`);

    const registros = data ?? [];
    const totalTransacciones = registros.length;
    const ingresosTotales = registros.reduce((acc, r) => acc + Number(r.monto), 0);
    const ticketMedio = totalTransacciones > 0 ? ingresosTotales / totalTransacciones : 0;

    return { totalTransacciones, ingresosTotales, ticketMedio };
}

/**
 * Obtiene métricas de una barra específica.
 */
export async function obtenerMetricasBarra(idBarra: number): Promise<MetricasBarra> {
    const supabase = await crearClienteServidor();

    // Transacciones de esta barra
    const { data: txs, error: errorTx } = await supabase
        .from('transacciones')
        .select('id_transaccion, monto')
        .eq('id_barra', idBarra)
        .eq('tipo_movimiento', 'compra');

    if (errorTx) throw new Error(`Error métricas barra: ${errorTx.message}`);

    const registros = txs ?? [];
    const totalTransacciones = registros.length;
    const ingresosTotales = registros.reduce((acc, r) => acc + Number(r.monto), 0);
    const ticketMedio = totalTransacciones > 0 ? ingresosTotales / totalTransacciones : 0;

    // Producto estrella y menos vendido: obtener líneas de transacción con nombres
    let productoEstrella: { nombre: string; cantidad: number } | null = null;
    let productoMenosVendido: { nombre: string; cantidad: number } | null = null;

    if (registros.length > 0) {
        const idsTx = registros.map((r) => r.id_transaccion);

        const { data: lineas } = await supabase
            .from('lineas_transaccion')
            .select('id_producto, cantidad')
            .in('id_transaccion', idsTx);

        if (lineas && lineas.length > 0) {
            // Agrupar por producto
            const conteo = new Map<number, number>();
            for (const l of lineas) {
                conteo.set(l.id_producto, (conteo.get(l.id_producto) ?? 0) + l.cantidad);
            }

            // Obtener nombres
            const idsProductos = [...conteo.keys()];
            const { data: prods } = await supabase
                .from('productos')
                .select('id_producto, nombre')
                .in('id_producto', idsProductos);

            const nombresPorId = new Map<number, string>();
            for (const p of prods ?? []) {
                nombresPorId.set(p.id_producto, p.nombre);
            }

            let maxCant = 0, minCant = Infinity;
            let maxId = 0, minId = 0;

            for (const [id, cant] of conteo) {
                if (cant > maxCant) { maxCant = cant; maxId = id; }
                if (cant < minCant) { minCant = cant; minId = id; }
            }

            if (maxId) {
                productoEstrella = { nombre: nombresPorId.get(maxId) ?? 'Desconocido', cantidad: maxCant };
            }
            if (minId && minId !== maxId) {
                productoMenosVendido = { nombre: nombresPorId.get(minId) ?? 'Desconocido', cantidad: minCant };
            }
        }
    }

    return { totalTransacciones, ingresosTotales, ticketMedio, productoEstrella, productoMenosVendido };
}

/** Obtener ingresos por barra (para el gráfico de rendimiento) */
export async function obtenerIngresosPorBarra(): Promise<{ idBarra: number; nombreBarra: string; ingresos: number }[]> {
    const supabase = await crearClienteServidor();

    // Get all bars
    const { data: barras } = await supabase
        .from('barras')
        .select('id_barra, nombre_localizacion')
        .order('nombre_localizacion');

    if (!barras) return [];

    // Get transactions grouped by bar
    const { data: txs } = await supabase
        .from('transacciones')
        .select('id_barra, monto')
        .eq('tipo_movimiento', 'compra');

    const ingresosPorBarra = new Map<number, number>();
    for (const tx of txs ?? []) {
        ingresosPorBarra.set(tx.id_barra, (ingresosPorBarra.get(tx.id_barra) ?? 0) + Number(tx.monto));
    }

    return barras.map((b: { id_barra: number; nombre_localizacion: string }) => ({
        idBarra: b.id_barra,
        nombreBarra: b.nombre_localizacion,
        ingresos: ingresosPorBarra.get(b.id_barra) ?? 0,
    })).sort((a, b) => b.ingresos - a.ingresos);
}
