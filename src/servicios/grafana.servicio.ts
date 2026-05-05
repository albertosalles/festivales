import 'server-only';

const GRAFANA_URL = process.env.GRAFANA_URL ?? 'https://albertosalles7.grafana.net';
const GRAFANA_TOKEN = process.env.GRAFANA_TOKEN;
const GRAFANA_DATASOURCE_UID = process.env.GRAFANA_DATASOURCE_UID ?? 'ffkh1j8viwbgge';

interface GrafanaQueryFrame {
    schema: {
        fields: { name: string; type: string }[];
    };
    data: {
        values: unknown[][];
    };
}

interface GrafanaQueryResponse {
    results: Record<string, { status: number; frames: GrafanaQueryFrame[]; error?: string }>;
}

/** Una fila genérica resultante de una query */
export type FilaGrafana = Record<string, string | number | null>;

/**
 * Ejecuta múltiples queries SQL contra el datasource de Postgres en Grafana
 * en una única llamada batch a /api/ds/query.
 *
 * Devuelve un mapa { refId → filas }. Las filas son objetos donde cada clave
 * es el nombre de la columna devuelta por la query.
 */
export async function ejecutarQueriesGrafana(
    queries: Record<string, string>,
): Promise<Record<string, FilaGrafana[]>> {
    if (!GRAFANA_TOKEN) {
        throw new Error('GRAFANA_TOKEN no está configurado en .env.local');
    }

    const body = {
        queries: Object.entries(queries).map(([refId, rawSql]) => ({
            refId,
            datasource: {
                type: 'grafana-postgresql-datasource',
                uid: GRAFANA_DATASOURCE_UID,
            },
            rawSql,
            format: 'table',
        })),
        from: 'now-24h',
        to: 'now',
    };

    const respuesta = await fetch(`${GRAFANA_URL}/api/ds/query`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${GRAFANA_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        cache: 'no-store',
    });

    if (!respuesta.ok) {
        throw new Error(`Grafana API ${respuesta.status}: ${await respuesta.text()}`);
    }

    const json = (await respuesta.json()) as GrafanaQueryResponse;
    const resultado: Record<string, FilaGrafana[]> = {};

    for (const [refId, item] of Object.entries(json.results)) {
        if (item.status !== 200 || !item.frames?.[0]) {
            resultado[refId] = [];
            continue;
        }
        resultado[refId] = frameAFilas(item.frames[0]);
    }

    return resultado;
}

/**
 * Convierte un frame column-oriented de Grafana en un array de filas.
 * Grafana devuelve `data.values` como `[col1[], col2[], ...]`.
 */
function frameAFilas(frame: GrafanaQueryFrame): FilaGrafana[] {
    const { fields } = frame.schema;
    const columnas = frame.data.values;
    const numFilas = columnas[0]?.length ?? 0;

    const filas: FilaGrafana[] = [];
    for (let i = 0; i < numFilas; i++) {
        const fila: FilaGrafana = {};
        fields.forEach((campo, idx) => {
            fila[campo.name] = columnas[idx]?.[i] as string | number | null;
        });
        filas.push(fila);
    }
    return filas;
}

/**
 * Atajo: ejecuta una sola query y devuelve la primera fila.
 * Útil para KPIs de valor único.
 */
export async function escalarGrafana(rawSql: string): Promise<FilaGrafana | null> {
    const { A } = await ejecutarQueriesGrafana({ A: rawSql });
    return A[0] ?? null;
}
