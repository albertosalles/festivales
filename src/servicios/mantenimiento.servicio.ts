import 'server-only';
import { ejecutarQueriesGrafana, type FilaGrafana } from './grafana.servicio';

/** Resumen de KPIs de salud de la BD */
export interface KpisMantenimiento {
    tamanoBd: string;
    conexionesActivas: number;
    cacheHitRatio: number;
    usuariosRegistrados: number;
    totalTransacciones: number;
    saldoTotalWallets: number;
    incidenciasPendientes: number;
    incidenciasResueltas: number;
    camarerosActivos: number;
}

export interface FilaTablaTamano {
    tabla: string;
    bytes: number;
}

export interface FilaActividadTabla {
    tabla: string;
    inserts: number;
    updates: number;
    deletes: number;
    filasVivas: number;
    filasMuertas: number;
}

export interface FilaVacuum {
    tabla: string;
    filasVivas: number;
    filasMuertas: number;
    pctBloat: number;
}

export interface FilaIndiceNoUsado {
    tabla: string;
    indice: string;
}

export interface FilaQueryLenta {
    query: string;
    llamadas: number;
    mediaMs: number;
    totalMs: number;
}

export interface FilaTransaccionesHora {
    hora: string;
    total: number;
}

export interface DatosMantenimiento {
    kpis: KpisMantenimiento;
    tamanoPorTabla: FilaTablaTamano[];
    actividadPorTabla: FilaActividadTabla[];
    tablasVacuum: FilaVacuum[];
    indicesNoUsados: FilaIndiceNoUsado[];
    queriesLentas: FilaQueryLenta[];
    transaccionesPorHora: FilaTransaccionesHora[];
}

const TABLAS_FESTIVAL = `(
    'usuario','wallet','transacciones','barras','camareros',
    'asignaciones_camareros','productos','lineas_transaccion',
    'incidencias_barra','configuracion_festival'
)`;

const QUERIES = {
    tamanoBd: `SELECT pg_size_pretty(pg_database_size('postgres')) AS valor;`,
    conexiones: `SELECT count(*)::int AS valor FROM pg_stat_activity WHERE state = 'active';`,
    cacheHit: `SELECT round(sum(blks_hit)*100.0/nullif(sum(blks_hit)+sum(blks_read),0),2)::float AS valor FROM pg_stat_database;`,
    usuarios: `SELECT count(*)::int AS valor FROM usuario;`,
    totalTx: `SELECT count(*)::int AS valor FROM transacciones;`,
    saldoWallets: `SELECT COALESCE(sum(saldo), 0)::float AS valor FROM wallet;`,
    incidPend: `SELECT count(*)::int AS valor FROM incidencias_barra WHERE estado = 'pendiente';`,
    incidRes: `SELECT count(*)::int AS valor FROM incidencias_barra WHERE estado = 'resuelta';`,
    camActivos: `SELECT count(*)::int AS valor FROM camareros WHERE activo = true;`,
    tamanoTablas: `SELECT relname AS tabla, pg_total_relation_size(relid)::bigint AS bytes
        FROM pg_stat_user_tables WHERE relname IN ${TABLAS_FESTIVAL}
        ORDER BY pg_total_relation_size(relid) DESC;`,
    actividad: `SELECT relname AS tabla, n_tup_ins::int AS inserts, n_tup_upd::int AS updates,
        n_tup_del::int AS deletes, n_live_tup::int AS vivas, n_dead_tup::int AS muertas
        FROM pg_stat_user_tables WHERE relname IN ${TABLAS_FESTIVAL}
        ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) DESC;`,
    vacuum: `SELECT relname AS tabla, n_dead_tup::int AS muertas, n_live_tup::int AS vivas,
        round(n_dead_tup*100.0/nullif(n_live_tup+n_dead_tup,0),2)::float AS bloat
        FROM pg_stat_user_tables WHERE relname IN ${TABLAS_FESTIVAL}
        ORDER BY n_dead_tup DESC;`,
    indices: `SELECT relname AS tabla, indexrelname AS indice
        FROM pg_stat_user_indexes WHERE idx_scan = 0 AND relname IN ${TABLAS_FESTIVAL}
        ORDER BY relname;`,
    lentas: `SELECT left(query, 80) AS query, calls::int AS llamadas,
        round(mean_exec_time::numeric,2)::float AS media,
        round(total_exec_time::numeric,2)::float AS total
        FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;`,
    txHora: `SELECT to_char(date_trunc('hour', fecha), 'YYYY-MM-DD HH24:MI') AS hora,
        count(*)::int AS total FROM transacciones
        WHERE fecha >= now() - interval '24 hours'
        GROUP BY 1 ORDER BY 1;`,
};

const num = (v: unknown, def = 0): number => (typeof v === 'number' ? v : def);
const str = (v: unknown, def = ''): string => (typeof v === 'string' ? v : def);

/**
 * Obtiene todos los datos de mantenimiento de la BD vía Grafana en una sola batch call.
 */
export async function obtenerDatosMantenimiento(): Promise<DatosMantenimiento> {
    const r = await ejecutarQueriesGrafana(QUERIES);

    const escalar = (filas: FilaGrafana[]): unknown =>
        filas[0] ? Object.values(filas[0])[0] : null;

    return {
        kpis: {
            tamanoBd: str(escalar(r.tamanoBd), '—'),
            conexionesActivas: num(escalar(r.conexiones)),
            cacheHitRatio: num(escalar(r.cacheHit)),
            usuariosRegistrados: num(escalar(r.usuarios)),
            totalTransacciones: num(escalar(r.totalTx)),
            saldoTotalWallets: num(escalar(r.saldoWallets)),
            incidenciasPendientes: num(escalar(r.incidPend)),
            incidenciasResueltas: num(escalar(r.incidRes)),
            camarerosActivos: num(escalar(r.camActivos)),
        },
        tamanoPorTabla: (r.tamanoTablas ?? []).map((f) => ({
            tabla: str(f.tabla),
            bytes: num(f.bytes),
        })),
        actividadPorTabla: (r.actividad ?? []).map((f) => ({
            tabla: str(f.tabla),
            inserts: num(f.inserts),
            updates: num(f.updates),
            deletes: num(f.deletes),
            filasVivas: num(f.vivas),
            filasMuertas: num(f.muertas),
        })),
        tablasVacuum: (r.vacuum ?? []).map((f) => ({
            tabla: str(f.tabla),
            filasVivas: num(f.vivas),
            filasMuertas: num(f.muertas),
            pctBloat: num(f.bloat),
        })),
        indicesNoUsados: (r.indices ?? []).map((f) => ({
            tabla: str(f.tabla),
            indice: str(f.indice),
        })),
        queriesLentas: (r.lentas ?? []).map((f) => ({
            query: str(f.query),
            llamadas: num(f.llamadas),
            mediaMs: num(f.media),
            totalMs: num(f.total),
        })),
        transaccionesPorHora: (r.txHora ?? []).map((f) => ({
            hora: str(f.hora),
            total: num(f.total),
        })),
    };
}

/** Formatea bytes a una representación legible (KB, MB, GB) */
export function formatearBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}
