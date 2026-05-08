import { crearClienteServidor } from '@/lib/supabase/servidor';
import { obtenerIdFestivalActivo } from '@/servicios/festivales.servicio';

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
    ingresosPorHoraCamarero: number;
}

/* ══════════════════════════════════════════════
   Métricas globales del dashboard
   ──────────────────────────────────────────────
   Todas estas funciones delegan la agregación al
   servidor PostgreSQL mediante RPCs (sprint5).
   Importante: agregar en JS sumando filas crudas
   de Supabase es incorrecto cuando se superan las
   1000 filas (límite por defecto del cliente JS).
   ══════════════════════════════════════════════ */

/**
 * Obtiene métricas globales del festival activo (recaudación, transacciones,
 * ticket medio).
 */
export async function obtenerMetricasGlobales(): Promise<MetricasGlobales> {
    const supabase = await crearClienteServidor();
    const idFestival = await obtenerIdFestivalActivo();

    const { data, error } = await supabase
        .rpc('obtener_metricas_globales', { p_id_festival: idFestival })
        .single<{
            total_transacciones: number;
            ingresos_totales: number;
            ticket_medio: number;
        }>();

    if (error || !data) {
        return { totalTransacciones: 0, ingresosTotales: 0, ticketMedio: 0 };
    }

    return {
        totalTransacciones: Number(data.total_transacciones),
        ingresosTotales: Number(data.ingresos_totales),
        ticketMedio: Number(data.ticket_medio),
    };
}

/** Obtener ingresos por barra del festival activo (gráfico de rendimiento) */
export async function obtenerIngresosPorBarra(): Promise<{
    idBarra: number;
    nombreBarra: string;
    ingresos: number;
    numTransacciones: number;
}[]> {
    const supabase = await crearClienteServidor();
    const idFestival = await obtenerIdFestivalActivo();

    const { data, error } = await supabase
        .rpc('obtener_ingresos_por_barra', { p_id_festival: idFestival });

    if (error || !data) return [];

    return (data as Array<{
        id_barra: number;
        nombre_barra: string;
        ingresos: number;
        num_transacciones: number;
    }>).map((r) => ({
        idBarra: r.id_barra,
        nombreBarra: r.nombre_barra,
        ingresos: Number(r.ingresos),
        numTransacciones: Number(r.num_transacciones),
    }));
}

/** Suma total de saldo en wallets del festival activo */
export async function obtenerSaldoRetenido(): Promise<number> {
    const supabase = await crearClienteServidor();
    const idFestival = await obtenerIdFestivalActivo();

    const { data, error } = await supabase
        .rpc('obtener_saldo_retenido', { p_id_festival: idFestival });

    if (error || data === null) return 0;
    return Number(data);
}

/** Media aritmética de las recargas realizadas en el festival activo */
export async function obtenerRecargaMedia(): Promise<number> {
    const supabase = await crearClienteServidor();
    const idFestival = await obtenerIdFestivalActivo();

    const { data, error } = await supabase
        .rpc('obtener_recarga_media', { p_id_festival: idFestival });

    if (error || data === null) return 0;
    return Number(data);
}

/** Volumen de compras agrupadas por franja horaria (mapa de calor) */
export async function obtenerMapaCalorHorario(): Promise<{ hora: string; total: number }[]> {
    const supabase = await crearClienteServidor();
    const idFestival = await obtenerIdFestivalActivo();

    const { data, error } = await supabase
        .rpc('obtener_mapa_calor_horario', { p_id_festival: idFestival });

    if (error || !data) return [];

    return (data as Array<{ hora: string; total: number }>).map((r) => ({
        hora: r.hora,
        total: Number(r.total),
    }));
}

/** Ratio de pedidos por hora operativa de cada barra del festival activo */
export async function obtenerEficienciaBarras(): Promise<{
    idBarra: number;
    nombre: string;
    pedidosPorHora: number;
}[]> {
    const supabase = await crearClienteServidor();
    const idFestival = await obtenerIdFestivalActivo();

    const { data, error } = await supabase
        .rpc('obtener_eficiencia_barras', { p_id_festival: idFestival });

    if (error || !data) return [];

    return (data as Array<{
        id_barra: number;
        nombre: string;
        pedidos_por_hora: number;
    }>).map((r) => ({
        idBarra: r.id_barra,
        nombre: r.nombre,
        pedidosPorHora: Number(r.pedidos_por_hora),
    }));
}

/* ══════════════════════════════════════════════
   Métricas de detalle por barra
   ══════════════════════════════════════════════ */

/**
 * Obtiene métricas de una barra específica.
 * No filtra por festival (la barra ya está identificada por su id global).
 *
 * Esta función mantiene el cálculo en JS porque necesita procesar las
 * transacciones para extraer múltiples métricas derivadas (hora pico,
 * tiempo medio entre pedidos, rendimiento por camarero, etc.). Para
 * evitar el límite de 1000 filas, paginamos explícitamente.
 */
export async function obtenerMetricasBarra(idBarra: number): Promise<MetricasBarra> {
    const supabase = await crearClienteServidor();

    const { data: asignaciones } = await supabase
        .from('asignaciones_camareros')
        .select('id_camarero, fecha_inicio, fecha_fin')
        .eq('id_barra', idBarra);

    // Transacciones de esta barra. Paginamos para superar el límite de 1000.
    const TAMANO_PAGINA = 1000;
    const registros: Array<{ id_transaccion: number; monto: number; fecha: string }> = [];
    let desde = 0;
    while (true) {
        const { data, error } = await supabase
            .from('transacciones')
            .select('id_transaccion, monto, fecha')
            .eq('id_barra', idBarra)
            .neq('tipo_movimiento', 'recarga')
            .order('id_transaccion', { ascending: true })
            .range(desde, desde + TAMANO_PAGINA - 1);

        if (error) throw new Error(`Error métricas barra: ${error.message}`);
        if (!data || data.length === 0) break;
        registros.push(...data);
        if (data.length < TAMANO_PAGINA) break;
        desde += TAMANO_PAGINA;
    }

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
        const conteoPorHora = new Map<string, number>();
        const dineroPorHora = new Map<string, number>();
        const timestamps: number[] = [];

        for (const r of registros) {
            const fecha = new Date(r.fecha);
            timestamps.push(fecha.getTime());
            const h = fecha.toLocaleString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', hourCycle: 'h23' }).padStart(2, '0') + ':00';
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

        timestamps.sort((a, b) => a - b);
        ultimaTransaccion = new Date(timestamps[timestamps.length - 1]).toISOString();

        if (timestamps.length >= 2) {
            let sumaDiferenciasMinutos = 0;
            let conteoValidos = 0;
            const UMBRAL_INACTIVIDAD_MIN = 60;

            for (let i = 1; i < timestamps.length; i++) {
                const difMinutos = (timestamps[i] - timestamps[i - 1]) / 60000;
                if (difMinutos <= UMBRAL_INACTIVIDAD_MIN) {
                    sumaDiferenciasMinutos += difMinutos;
                    conteoValidos++;
                }
            }

            if (conteoValidos > 0) {
                tiempoMedioEntrePedidosMin = sumaDiferenciasMinutos / conteoValidos;
            }
        }
    }

    // ── Producto estrella, menos vendido, unidades totales, categoría más vendida ──
    let productoEstrella: { nombre: string; cantidad: number } | null = null;
    let productoMenosVendido: { nombre: string; cantidad: number } | null = null;
    let unidadesTotalesVendidas = 0;
    let categoriaMasVendida: { categoria: string; cantidad: number } | null = null;

    if (registros.length > 0) {
        const idsTx = registros.map((r) => r.id_transaccion);

        // También paginamos las líneas de transacción para evitar el límite.
        const lineas: Array<{ id_producto: number; cantidad: number }> = [];
        for (let i = 0; i < idsTx.length; i += TAMANO_PAGINA) {
            const trozo = idsTx.slice(i, i + TAMANO_PAGINA);
            const { data } = await supabase
                .from('lineas_transaccion')
                .select('id_producto, cantidad')
                .in('id_transaccion', trozo);
            if (data) lineas.push(...data);
        }

        if (lineas.length > 0) {
            const conteo = new Map<number, number>();
            for (const l of lineas) {
                conteo.set(l.id_producto, (conteo.get(l.id_producto) ?? 0) + l.cantidad);
                unidadesTotalesVendidas += l.cantidad;
            }

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
        totalManHours += (fin - inicio) / 3600000;
        if (inicio < inicioBarra) inicioBarra = inicio;
        if (fin > finBarra) finBarra = fin;
    });

    const ingresosPorHoraCamarero = totalManHours > 0 ? ingresosTotales / totalManHours : 0;

    const rendimientoPorCamarero = new Map<number, number>();

    registros.forEach(tx => {
        const fechaTx = new Date(tx.fecha).getTime();
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
        ingresosPorHoraCamarero,
    };
}
