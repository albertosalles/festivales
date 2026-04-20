import { crearClienteServidor } from '@/lib/supabase/servidor';

/** Géneros musicales disponibles en el festival */
export const GENEROS_MUSICA = [
    'Techno',
    'Rock',
    'Indie',
    'Pop',
    'Urban',
    'Reggaetón',
    'Electrónica',
    'Metal',
] as const;

/** Clave usada en configuracion_festival para la música actual */
const CLAVE_MUSICA_SONANDO = 'musica_sonando_actualmente';

/**
 * Obtiene el género musical que está sonando actualmente en el festival.
 * Lee de la tabla configuracion_festival con clave 'musica_sonando_actualmente'.
 */
export async function obtenerMusicaSonando(): Promise<string | null> {
    const supabase = await crearClienteServidor();

    const { data, error } = await supabase
        .from('configuracion_festival')
        .select('valor')
        .eq('clave', CLAVE_MUSICA_SONANDO)
        .single();

    if (error) {
        // Si no existe la fila aún, devolver null
        if (error.code === 'PGRST116') return null;
        throw new Error(`Error al obtener música sonando: ${error.message}`);
    }

    return data?.valor ?? null;
}

/**
 * Actualiza el género musical que está sonando actualmente.
 * Usa upsert para crear la fila si no existe o actualizarla si ya existe.
 */
export async function actualizarMusicaSonando(genero: string): Promise<void> {
    const supabase = await crearClienteServidor();

    const { error } = await supabase
        .from('configuracion_festival')
        .upsert(
            { clave: CLAVE_MUSICA_SONANDO, valor: genero },
            { onConflict: 'clave' }
        );

    if (error) {
        throw new Error(`Error al actualizar música sonando: ${error.message}`);
    }
}

/**
 * Devuelve la lista de géneros musicales disponibles en el festival.
 */
export function obtenerGenerosDisponibles(): string[] {
    return [...GENEROS_MUSICA];
}
