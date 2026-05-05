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

/**
 * Helper: devuelve los IDs de barras del festival activo.
 * Se usa para filtrar transacciones (que no tienen id_festival propio).
 */
async function idsBarrasFestivalActivo(): Promise<number[]> {
    const supabase = await crearClienteServidor();
    const idFestival = await obtenerIdFestivalActivo();
    const { data } = await supabase
        .from('barras')
        .select('id_barra')
        .eq('id_festival', idFestival);
    return (data ?? []).map((b: { id_barra: number }) => b.id_barra);
}

/**
 * Obtiene métricas globales del festival activo.
 */
export async function obtenerMetricasGlobales(): Promise<MetricasGlobales> {
    const supabase = await crearClienteServidor();
    const idsBarras = await idsBarrasFestivalActivo();

    if (idsBarras.length === 0) {
        return { totalTransacciones: 0, ingresosTotales: 0, ticketMedio: 0 };
    }

    const { data, error } = await supabase
        .from('transacciones')
        .select('monto')
        .in('id_barra', idsBarras)
        .neq('tipo_movimiento', 'recarga');

    if (error) throw new Error(`Error al obtener métricas: ${error.message}`);

    const registros = data ?? [];
    const totalTransacciones = registros.length;
    const ingresosTotales = registros.reduce((acc, r) => acc + Number(r.monto), 0);
    const ticketMedio = totalTransacciones > 0 ? ingresosTotales / totalTransacciones : 0;

    return { totalTransacciones, ingresosTotales, ticketMedio };
}

/**
 * Obtiene métricas de una barra específica.
 * No filtra por festival (la barra ya está identificada por su id global).
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
        .neq('tipo_movimiento', 'recarga');

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

        const { data: lineas } = await supabase
            .from('lineas_transaccion')
            .select('id_producto, cantidad')
            .in('id_transaccion', idsTx);

        if (lineas && lineas.length > 0) {
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

/** Obtener ingresos por barra del festival activo (gráfico de rendimiento) */
export async function obtenerIngresosPorBarra(): Promise<{ idBarra: number; nombreBarra: string; ingresos: number }[]> {
    const supabase = await crearClienteServidor();
    const idFestival = await obtenerIdFestivalActivo();

    const { data: barras } = await supabase
        .from('barras')
        .select('id_barra, nombre_localizacion')
        .eq('id_festival', idFestival)
        .order('nombre_localizacion');

    if (!barras || barras.length === 0) return [];

    const idsBarras = barras.map((b: { id_barra: number }) => b.id_barra);
    const { data: txs } = await supabase
        .from('transacciones')
        .select('id_barra, monto')
        .in('id_barra', idsBarras)
        .neq('tipo_movimiento', 'recarga');

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

/** Suma total de saldo en wallets del festival activo */
export async function obtenerSaldoRetenido(): Promise<number> {
    const supabase = await crearClienteServidor();
    const idFestival = await obtenerIdFestivalActivo();

    const { data: usuarios } = await supabase
        .from('usuario')
        .select('id_usuario')
        .eq('id_festival', idFestival);

    if (!usuarios || usuarios.length === 0) return 0;
    const idsUsuarios = usuarios.map((u: { id_usuario: number }) => u.id_usuario);

    const { data, error } = await supabase
        .from('wallet')
        .select('saldo')
        .in('id_usuario', idsUsuarios);

    if (error) return 0;
    return (data ?? []).reduce((acc, r) => acc + Number(r.saldo), 0);
}

/** Media aritmética de las recargas realizadas en el festival activo */
export async function obtenerRecargaMedia(): Promise<number> {
    const supabase = await crearClienteServidor();
    const idsBarras = await idsBarrasFestivalActivo();
    if (idsBarras.length === 0) return 0;

    const { data, error } = await supabase
        .from('transacciones')
        .select('monto')
        .in('id_barra', idsBarras)
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
    const idsBarras = await idsBarrasFestivalActivo();
    if (idsBarras.length === 0) return [];

    const { data, error } = await supabase
        .from('transacciones')
        .select('fecha')
        .in('id_barra', idsBarras)
        .neq('tipo_movimiento', 'recarga');

    if (error || !data) return [];

    const conteo = new Map<string, number>();
    for (const d of data) {
        const h = new Date(d.fecha).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', hourCycle: 'h23' }).padStart(2, '0') + ':00';
        conteo.set(h, (conteo.get(h) ?? 0) + 1);
    }

    return Array.from(conteo.entries())
        .map(([hora, total]) => ({ hora, total }))
        .sort((a, b) => a.hora.localeCompare(b.hora));
}

/** Ratio de pedidos por hora operativa de cada barra del festival activo */
export async function obtenerEficienciaBarras(): Promise<{ idBarra: number; nombre: string; pedidosPorHora: number }[]> {
    const supabase = await crearClienteServidor();
    const idFestival = await obtenerIdFestivalActivo();

    const { data: barras, error: errBarras } = await supabase
        .from('barras')
        .select('id_barra, nombre_localizacion')
        .eq('id_festival', idFestival);
    if (errBarras || !barras || barras.length === 0) return [];

    const idsBarras = barras.map((b: { id_barra: number }) => b.id_barra);
    const { data: txs, error: errTxs } = await supabase
        .from('transacciones')
        .select('id_barra, fecha')
        .in('id_barra', idsBarras)
        .neq('tipo_movimiento', 'recarga');
    if (errTxs || !txs) return [];

    const nombresMap = new Map<number, string>();
    for (const b of barras) nombresMap.set(b.id_barra, b.nombre_localizacion);

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

        const horasActivas = new Set<string>();
        for (const ts of timestamps) {
            const d = new Date(ts);
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
            horasActivas.add(key);
        }

        const numHorasActivas = horasActivas.size > 0 ? horasActivas.size : 1;
        resultados.push({ idBarra, nombre, pedidosPorHora: timestamps.length / numHorasActivas });
    }

    return resultados.sort((a, b) => b.pedidosPorHora - a.pedidosPorHora);
}
