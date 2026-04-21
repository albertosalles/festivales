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
    // Métricas avanzadas
    horaPico: string | null;
    horaPicoVolumen: number;
    unidadesTotalesVendidas: number;
    ultimaTransaccion: string | null;
    categoriaMasVendida: { categoria: string; cantidad: number } | null;
    tiempoMedioEntrePedidosMin: number | null;
    ingresosHorarios: { hora: string; ingresos: number }[];
    rendimientoPorCamarero: Map<number, number>;
    ingresosPorCamareroPonderado: number;
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

    const { data: asignaciones } = await supabase
        .from('asignaciones_camareros')
        .select('id_camarero, fecha_inicio, fecha_fin')
        .eq('id_barra', idBarra);

    // Transacciones de esta barra (ahora incluimos fecha para métricas temporales)
    const { data: txs, error: errorTx } = await supabase
        .from('transacciones')
        .select('id_transaccion, monto, fecha')
        .eq('id_barra', idBarra)
        .eq('tipo_movimiento', 'compra');

    if (errorTx) throw new Error(`Error métricas barra: ${errorTx.message}`);

    const registros = txs ?? [];
    const totalTransacciones = registros.length;
    const ingresosTotales = registros.reduce((acc, r) => acc + Number(r.monto), 0);
    const ticketMedio = totalTransacciones > 0 ? ingresosTotales / totalTransacciones : 0;

    // ── Hora pico y última transacción ──
    let horaPico: string | null = null;
    let horaPicoVolumen = 0;
    let ultimaTransaccion: string | null = null;
    let tiempoMedioEntrePedidosMin: number | null = null;
    let ingresosHorarios: { hora: string; ingresos: number }[] = [];

    if (registros.length > 0) {
        // Hora pico: agrupar por hora
        const conteoPorHora = new Map<string, number>();
        const dineroPorHora = new Map<string, number>();
        const timestamps: number[] = [];

        for (const r of registros) {
            const fecha = new Date(r.fecha);
            timestamps.push(fecha.getTime());
            const h = fecha.getHours().toString().padStart(2, '0') + ':00';
            conteoPorHora.set(h, (conteoPorHora.get(h) ?? 0) + 1);
            dineroPorHora.set(h, (dineroPorHora.get(h) ?? 0) + Number(r.monto));
        }

        let maxVol = 0;
        for (const [hora, vol] of conteoPorHora) {
            if (vol > maxVol) {
                maxVol = vol;
                horaPico = hora;
                horaPicoVolumen = vol;
            }
        }

        ingresosHorarios = Array.from(dineroPorHora.entries())
            .map(([hora, ingresos]) => ({ hora, ingresos }))
            .sort((a, b) => a.hora.localeCompare(b.hora));

        // Última transacción
        timestamps.sort((a, b) => a - b);
        ultimaTransaccion = new Date(timestamps[timestamps.length - 1]).toISOString();

        // Tiempo medio entre pedidos
        if (timestamps.length >= 2) {
            const rangoTotal = timestamps[timestamps.length - 1] - timestamps[0];
            tiempoMedioEntrePedidosMin = (rangoTotal / (timestamps.length - 1)) / 60000;
        }
    }

    // ── Producto estrella, menos vendido, unidades totales, categoría más vendida ──
    let productoEstrella: { nombre: string; cantidad: number } | null = null;
    let productoMenosVendido: { nombre: string; cantidad: number } | null = null;
    let unidadesTotalesVendidas = 0;
    let categoriaMasVendida: { categoria: string; cantidad: number } | null = null;

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
                unidadesTotalesVendidas += l.cantidad;
            }

            // Obtener nombres y categorías
            const idsProductos = [...conteo.keys()];
            const { data: prods } = await supabase
                .from('productos')
                .select('id_producto, nombre, categoria')
                .in('id_producto', idsProductos);

            const nombresPorId = new Map<number, string>();
            const categoriaPorId = new Map<number, string>();
            for (const p of prods ?? []) {
                nombresPorId.set(p.id_producto, p.nombre);
                if (p.categoria) categoriaPorId.set(p.id_producto, p.categoria);
            }

            // Producto estrella y menos vendido
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

            // Categoría más vendida
            const conteoPorCategoria = new Map<string, number>();
            for (const [idProd, cant] of conteo) {
                const cat = categoriaPorId.get(idProd) ?? 'Sin categoría';
                conteoPorCategoria.set(cat, (conteoPorCategoria.get(cat) ?? 0) + cant);
            }
            let maxCatCant = 0;
            for (const [cat, cant] of conteoPorCategoria) {
                if (cant > maxCatCant) {
                    maxCatCant = cant;
                    categoriaMasVendida = { categoria: cat, cantidad: cant };
                }
            }
        }
    }



    const historial = asignaciones ?? [];

    let totalManHours = 0;
    let inicioBarra = Infinity;
    let finBarra = -Infinity;

    historial.forEach(a => {
        const inicio = new Date(a.fecha_inicio).getTime();
        const fin = a.fecha_fin ? new Date(a.fecha_fin).getTime() : Date.now();
        totalManHours += (fin - inicio) / 3600000; // Horas decimales
        if (inicio < inicioBarra) inicioBarra = inicio;
        if (fin > finBarra) finBarra = fin;
    });

    const duracionOperativaBarra = (finBarra - inicioBarra) / 3600000;
    // Camareros promedio (FTE) = Horas hombre totales / Horas reales de apertura
    const camarerosPromedioFTE = duracionOperativaBarra > 0 ? totalManHours / duracionOperativaBarra : 0;
    const ingresosPorCamareroPonderado = camarerosPromedioFTE > 0 ? ingresosTotales / camarerosPromedioFTE : 0;

    const rendimientoPorCamarero = new Map<number, number>();

    registros.forEach(tx => {
        const fechaTx = new Date(tx.fecha).getTime();
        // ¿Quiénes estaban trabajando en este momento exacto?
        const camarerosEnEseMomento = historial.filter(a => {
            const inicio = new Date(a.fecha_inicio).getTime();
            const fin = a.fecha_fin ? new Date(a.fecha_fin).getTime() : Date.now();
            return fechaTx >= inicio && fechaTx <= fin;
        });

        if (camarerosEnEseMomento.length > 0) {
            const cuotaIndividual = Number(tx.monto) / camarerosEnEseMomento.length;
            camarerosEnEseMomento.forEach(a => {
                const actual = rendimientoPorCamarero.get(a.id_camarero) ?? 0;
                rendimientoPorCamarero.set(a.id_camarero, actual + cuotaIndividual);
            });
        }
    });

    return {
        totalTransacciones,
        ingresosTotales,
        ticketMedio,
        productoEstrella,
        productoMenosVendido,
        horaPico,
        horaPicoVolumen,
        unidadesTotalesVendidas,
        ultimaTransaccion,
        categoriaMasVendida,
        tiempoMedioEntrePedidosMin,
        ingresosHorarios,
        rendimientoPorCamarero,
        ingresosPorCamareroPonderado,
    };
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

/* ══════════════════════════════════════════════
   Métricas Avanzadas — Dashboard Global
   ══════════════════════════════════════════════ */

/** Suma total de saldo en todas las wallets (dinero pre-cargado sin gastar) */
export async function obtenerSaldoRetenido(): Promise<number> {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase
        .from('wallet')
        .select('saldo');

    if (error) return 0;
    return (data ?? []).reduce((acc, r) => acc + Number(r.saldo), 0);
}

/** Media aritmética de las recargas realizadas */
export async function obtenerRecargaMedia(): Promise<number> {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase
        .from('transacciones')
        .select('monto')
        .eq('tipo_movimiento', 'recarga');

    if (error) return 0;
    const recargas = data ?? [];
    if (recargas.length === 0) return 0;
    const total = recargas.reduce((acc, r) => acc + Number(r.monto), 0);
    return total / recargas.length;
}

/** Volumen de compras agrupadas por franja horaria (mapa de calor) */
export async function obtenerMapaCalorHorario(): Promise<{ hora: string; total: number }[]> {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase
        .from('transacciones')
        .select('fecha')
        .eq('tipo_movimiento', 'compra');

    if (error || !data) return [];

    const conteo = new Map<string, number>();
    for (const d of data) {
        const h = new Date(d.fecha).getHours().toString().padStart(2, '0') + ':00';
        conteo.set(h, (conteo.get(h) ?? 0) + 1);
    }

    return Array.from(conteo.entries())
        .map(([hora, total]) => ({ hora, total }))
        .sort((a, b) => a.hora.localeCompare(b.hora));
}

/** Ratio de pedidos por hora operativa de cada barra */
export async function obtenerEficienciaBarras(): Promise<{ idBarra: number; nombre: string; pedidosPorHora: number }[]> {
    const supabase = await crearClienteServidor();

    const { data: barras, error: errBarras } = await supabase
        .from('barras')
        .select('id_barra, nombre_localizacion');
    if (errBarras || !barras) return [];

    const { data: txs, error: errTxs } = await supabase
        .from('transacciones')
        .select('id_barra, fecha')
        .eq('tipo_movimiento', 'compra');
    if (errTxs || !txs) return [];

    // Construir mapa nombre por id
    const nombresMap = new Map<number, string>();
    for (const b of barras) nombresMap.set(b.id_barra, b.nombre_localizacion);

    // Agrupar fechas por barra
    const fechasPorBarra = new Map<number, number[]>();
    for (const tx of txs) {
        if (!fechasPorBarra.has(tx.id_barra)) fechasPorBarra.set(tx.id_barra, []);
        fechasPorBarra.get(tx.id_barra)!.push(new Date(tx.fecha).getTime());
    }

    const resultados: { idBarra: number; nombre: string; pedidosPorHora: number }[] = [];
    for (const [idBarra, nombre] of nombresMap.entries()) {
        const timestamps = fechasPorBarra.get(idBarra);
        if (!timestamps || timestamps.length === 0) {
            resultados.push({ idBarra, nombre, pedidosPorHora: 0 });
            continue;
        }
        const min = Math.min(...timestamps);
        const max = Math.max(...timestamps);
        let horas = (max - min) / (1000 * 60 * 60);
        if (horas < 1) horas = 1; // mínimo 1 hora para evitar ratios inflados
        resultados.push({ idBarra, nombre, pedidosPorHora: timestamps.length / horas });
    }

    return resultados.sort((a, b) => b.pedidosPorHora - a.pedidosPorHora);
}
